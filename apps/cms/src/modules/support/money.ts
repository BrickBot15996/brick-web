/** "€1,234": whole euros, English grouping (the CMS is English only). */
export const euro = (n: number) => `€${Math.round(n).toLocaleString('en-GB')}`;
