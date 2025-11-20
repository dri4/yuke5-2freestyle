import React from "react";
import { useDeviceType } from "@/hooks/use-device-type";

import IndexMobile from "./Index-mobile";
import IndexDesktop from "./Index-desktop";

export default function Index() {
  const device = useDeviceType();

  if (device === "mobile" || device === "tablet") {
    return <IndexMobile />;
  }
  return <IndexDesktop />;
}
