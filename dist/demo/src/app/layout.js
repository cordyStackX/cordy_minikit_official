import { jsx as _jsx } from "react/jsx-runtime";
import "./globals.css";
export const metadata = {
    title: "Cordy Minikit · Local Preview",
    description: "Local preview of the Cordy Minikit wallet connection UI.",
};
export default function RootLayout({ children }) {
    return (_jsx("html", { lang: "en", className: "h-full antialiased", children: _jsx("body", { className: "min-h-full flex flex-col", children: children }) }));
}
