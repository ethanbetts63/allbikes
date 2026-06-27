"use client";

import Link from "next/link";

interface FooterAuthLinksProps {
  linkClass: string;
}

const FooterAuthLinks = ({ linkClass }: FooterAuthLinksProps) => {
  return (
    <li>
      <Link href="/login" className={linkClass}>Login</Link>
    </li>
  );
};

export default FooterAuthLinks;
