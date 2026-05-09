"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface FooterAuthLinksProps {
  linkClass: string;
}

const FooterAuthLinks = ({ linkClass }: FooterAuthLinksProps) => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <li>
        <Link href="/login" className={linkClass}>Login</Link>
      </li>
    );
  }

  return (
    <>
      {user.is_staff && (
        <li>
          <Link href="/dashboard" className={linkClass}>Dashboard</Link>
        </li>
      )}
      <li>
        <button onClick={logout} className={linkClass}>Logout</button>
      </li>
    </>
  );
};

export default FooterAuthLinks;
