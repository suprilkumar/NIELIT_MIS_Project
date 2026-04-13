"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}