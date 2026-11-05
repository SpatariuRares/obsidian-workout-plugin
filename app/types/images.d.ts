/** esbuild inlines imported images as data: URLs (esbuild.config.mjs) */
declare module "*.png" {
  const dataUrl: string;
  export default dataUrl;
}
