import axios from "axios";

export async function resolveDoi(doi: string) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const res = await axios.get(url);
  return res.data;
}

