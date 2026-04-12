"use client";

import { useEffect } from "react";
import { applyTheme, getSavedTheme } from "@/lib/theme";

export default function ThemeInitializer() {
    useEffect(() => {
        applyTheme(getSavedTheme());
    }, []);

    return null;
}
