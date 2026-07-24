"""Extract exploded-diagram images from a BIFF8 (.xls) SYM parts book.

The diagrams are stored as Escher BStore BLIP records inside the OLE ``Workbook``
stream. This module reassembles the drawing records from the BIFF stream, decodes
each image, and maps every worksheet to its largest diagram (its ``pib`` blip
reference). Pure Python — no LibreOffice, no OCR. Proven in the feasibility spike.
"""
import io
import logging
import struct

import olefile
from PIL import Image

logger = logging.getLogger(__name__)

# BIFF record types
_BOF = 0x0809
_EOF = 0x000A
_BOUNDSHEET = 0x0085
_MSODRAWINGGROUP = 0x00EB
_MSODRAWING = 0x00EC
_CONTINUE = 0x003C

# Escher record types
_ESCHER_CONTAINERS = {0xF000, 0xF001, 0xF002, 0xF003, 0xF004}
_BSTORE_CONTAINER = 0xF001
_BSE = 0xF007
_OPT = 0xF00B
_PIB_PROP = 0x0104  # picture blip index property id (masked with 0x3FFF)

_PNG_SIG = b"\x89PNG\r\n\x1a\n"
_JPG_SIG = b"\xff\xd8\xff"


def _iter_biff_records(stream):
    """Yield (record_type, body) for each BIFF record, merging CONTINUE records
    into the preceding record's body."""
    i, n = 0, len(stream)
    prev = None  # (rtype, bytearray)
    while i + 4 <= n:
        rtype, rlen = struct.unpack_from("<HH", stream, i)
        i += 4
        body = stream[i:i + rlen]
        i += rlen
        if rtype == _CONTINUE and prev is not None:
            prev[1].extend(body)
            continue
        if prev is not None:
            yield prev[0], bytes(prev[1])
        prev = (rtype, bytearray(body))
    if prev is not None:
        yield prev[0], bytes(prev[1])


def _decode_blip_body(bse_body):
    """Return decoded (image_bytes, size) from a BSE record body, or None."""
    idx = bse_body.find(_JPG_SIG)
    if idx < 0:
        idx = bse_body.find(_PNG_SIG)
    if idx < 0:
        return None
    blob = bse_body[idx:]
    try:
        im = Image.open(io.BytesIO(blob))
        im.load()
        return blob, im.size
    except Exception:
        return None


def _walk_escher(buf, callback):
    """Walk an Escher record tree, invoking callback(rtype, ver_inst, body) for
    each record and recursing into containers."""
    i, n = 0, len(buf)
    while i + 8 <= n:
        ver_inst, rtype, rlen = struct.unpack_from("<HHI", buf, i)
        i += 8
        body = buf[i:i + rlen]
        callback(rtype, ver_inst, body)
        if (ver_inst & 0x0F) == 0x0F and rtype in _ESCHER_CONTAINERS:
            _walk_escher(body, callback)
        i += rlen


def _extract_ordered_blips(drawing_group):
    """Return an ordered list of decoded blips (index i -> BStore index i+1).

    Each entry is (image_bytes, (w, h)) or None if a blip failed to decode.
    """
    blips = []

    # Descend to the BStoreContainer and iterate its BSE children directly, in
    # order, so the position gives the 1-based BStore index.
    def find_bstore(buf):
        i, n = 0, len(buf)
        while i + 8 <= n:
            ver_inst, rtype, rlen = struct.unpack_from("<HHI", buf, i)
            i += 8
            body = buf[i:i + rlen]
            if rtype == _BSTORE_CONTAINER:
                return body
            if (ver_inst & 0x0F) == 0x0F and rtype in _ESCHER_CONTAINERS:
                found = find_bstore(body)
                if found is not None:
                    return found
            i += rlen
        return None

    bstore = find_bstore(drawing_group)
    if bstore is None:
        return blips

    i, n = 0, len(bstore)
    while i + 8 <= n:
        ver_inst, rtype, rlen = struct.unpack_from("<HHI", bstore, i)
        i += 8
        body = bstore[i:i + rlen]
        i += rlen
        if rtype == _BSE:
            decoded = _decode_blip_body(body)
            blips.append(decoded)
    return blips


def _sheet_pib_indices(msodrawing_body):
    """Return the set of 1-based BStore blip indices referenced by a worksheet's
    MSODRAWING record (via OPT pib properties)."""
    indices = set()

    def visit(rtype, ver_inst, body):
        if rtype != _OPT:
            return
        n_props = ver_inst >> 4
        p = 0
        for _ in range(n_props):
            if p + 6 > len(body):
                break
            opid, val = struct.unpack_from("<HI", body, p)
            p += 6
            if (opid & 0x3FFF) == _PIB_PROP and val:
                indices.add(val)

    _walk_escher(msodrawing_body, visit)
    return indices


def extract_diagrams(xls_path):
    """Map each worksheet name to its diagram image bytes.

    Returns ``{sheet_name: png_or_jpeg_bytes}`` for every sheet that references a
    decodable diagram (its largest referenced blip). Sheets without a diagram are
    omitted.
    """
    ole = olefile.OleFileIO(xls_path)
    try:
        stream_name = "Workbook" if ole.exists("Workbook") else "Book"
        wb = ole.openstream(stream_name).read()
    finally:
        ole.close()

    drawing_group = bytearray()
    sheet_names = []
    sheet_drawings = {}  # worksheet_index -> list[msodrawing body]
    # substream_index: 0 = globals substream, 1.. = worksheets in order.
    substream_index = -1

    for rtype, body in _iter_biff_records(wb):
        if rtype == _BOF:
            substream_index += 1
            continue
        if rtype == _BOUNDSHEET:
            # In the globals substream; one per worksheet, in sheet order.
            sheet_names.append(_decode_boundsheet_name(body))
            continue
        if substream_index == 0:
            # globals substream — the drawing group (BStore) lives here
            if rtype == _MSODRAWINGGROUP:
                drawing_group.extend(body)
        else:
            worksheet_index = substream_index - 1
            if rtype == _MSODRAWING:
                sheet_drawings.setdefault(worksheet_index, []).append(body)

    blips = _extract_ordered_blips(bytes(drawing_group))

    result = {}
    for ws_index, drawings in sheet_drawings.items():
        if ws_index >= len(sheet_names):
            continue
        name = sheet_names[ws_index]
        # gather all referenced, decodable blips; pick the largest by area
        best = None
        best_area = -1
        for body in drawings:
            for idx in _sheet_pib_indices(body):
                blip = blips[idx - 1] if 1 <= idx <= len(blips) else None
                if blip is None:
                    continue
                img_bytes, (w, h) = blip
                area = w * h
                if area > best_area:
                    best_area = area
                    best = img_bytes
        if best is not None:
            result[name] = best
    return result


def _decode_boundsheet_name(body):
    """Decode the sheet name from a BOUNDSHEET record body (BIFF8)."""
    try:
        # bytes 0-3: BOF position; 4: visibility; 5: sheet type; 6: name length;
        # 7: flags (0 = compressed/latin1, 1 = utf-16le); 8.. name
        length = body[6]
        flags = body[7]
        raw = body[8:]
        if flags & 0x01:
            return raw[:length * 2].decode("utf-16-le", "replace")
        return raw[:length].decode("latin-1", "replace")
    except Exception:
        return ""
