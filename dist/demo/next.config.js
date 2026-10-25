import path from "node:path";
const minikitRoot = path.resolve(process.cwd(), "..");
const nextConfig = {
    turbopack: {
        root: minikitRoot,
        resolveAlias: {
            react: path.join(minikitRoot, "node_modules/react"),
            "react-dom": path.join(minikitRoot, "node_modules/react-dom"),
        },
    },
};
export default nextConfig;
