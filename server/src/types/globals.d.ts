declare module 'pdf-parse' {
  const parse: (buffer: Buffer, options?: object) => Promise<{ text: string; numpages: number }>;
  export default parse;
}
