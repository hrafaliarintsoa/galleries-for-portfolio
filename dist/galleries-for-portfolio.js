import s from "path";
import D from "image-size";
import u from "sharp";
import { promises as h, existsSync as y } from "node:fs";
async function G(e) {
  console.log("Optimizing images....");
  try {
    await Promise.all(
      e.galleries.map(async (a) => {
        const i = s.join(e.imagesDir, a), r = await h.readdir(i), n = s.join(i + "");
        await C(r, a, e);
        const t = await h.readdir(i);
        await S(n), await I(n), await b(s.join(n, "/optimized")), await b(s.join(n, "/thumbnails")), await Promise.all(
          t.map(async (l) => {
            if (w(l)) {
              const m = s.join(i, l), g = z(l, e), f = s.join(
                i + "/optimized",
                d(g)
              ), j = s.join(
                i + "/thumbnails",
                d(g)
              );
              await $(m, f, e), await v(m, j, e);
            }
          })
        );
        const o = await F(
          z(t, e),
          i,
          a,
          e
        ), c = JSON.stringify(o, null, 2);
        await h.writeFile(s.join(i, "images.json"), c);
      })
    ), await T(e);
  } catch (a) {
    console.error("Error optimizing images:", a);
  }
}
function z(e, a) {
  if (Array.isArray(e) && e.length)
    return e.map((r) => {
      if (!w(r))
        return r;
      let n = r;
      return a.renameOptions.charsToRename.forEach((t) => {
        n = n.replace(t, a.renameOptions.renameBy);
      }), n;
    });
  if (!w(e))
    return e;
  let i = e;
  return a.renameOptions.charsToRename.forEach((r) => {
    i = i.replace(r, a.renameOptions.renameBy);
  }), i;
}
function w(e) {
  const a = s.extname(e);
  return a === ".jpg" || a === ".jpeg" || a === ".png";
}
function d(e) {
  return e.replace(s.extname(e), ".webp");
}
async function p(e) {
  return console.log(`Getting image size for ${e}`), new Promise((a, i) => {
    D(e, (r, n) => {
      r ? i(r) : a(n);
    });
  });
}
async function F(e, a, i, r) {
  console.log(`Creating image objects for ${i}`);
  const n = [];
  for (const t of e)
    if (w(t)) {
      const o = s.join(a, "thumbnails", t), c = s.join(a, "optimized", t), l = O({}, i), m = await p(c.replace(".jpg", ".webp")), g = await p(o.replace(".jpg", ".webp"));
      let f = !1;
      g.width && g.height && (f = g.height > g.width);
      const j = i.includes("home-") ? P(t, i, r) : i;
      n.push({
        name: t.replace(".jpg", ""),
        path: s.join(r.imagesAssetsDir, i, "optimized", d(t)),
        thumbnailPath: s.join(
          r.imagesAssetsDir,
          i,
          "thumbnails",
          d(t)
        ),
        thumbnailDimensions: g,
        optimizedDimensions: m,
        portrait: f,
        galleryId: j,
        file: t.replace(".jpg", ""),
        alt: l,
        parentId: i
      });
    }
  return n;
}
function P(e, a, i) {
  const n = i.galleries.map(
    (t) => s.join(i.imagesDir, t, "optimized", e.replace(".jpg", ".webp"))
  ).filter((t) => !t.includes(a)).find((t) => y(t));
  if (n) {
    const t = s.normalize(n);
    return i.galleries.find(
      (c) => t.includes(s.normalize(c))
    ) || null;
  }
  return null;
}
function O(e, a) {
  let i = `Hajaniaina Rafaliarintsoa ${a}`;
  return e.DigitalCreationDate && (i += ` ${e.DigitalCreationDate}`), i;
}
async function $(e, a, i) {
  console.log(`Reducing image size of ${e}`), console.log(`Destination: ${a}`);
  const r = { gravity: "southeast" }, { width: n, height: t } = await p(e);
  let o = !1;
  n && t && (o = t > n);
  const [c, l] = o ? [i.optimizedSize?.height, i.optimizedSize?.width] : [i.optimizedSize?.width, i.optimizedSize?.height];
  try {
    const m = u(e).withMetadata({
      exif: {
        IFD0: {
          Copyright: i.copyright || (/* @__PURE__ */ new Date()).getFullYear().toString()
        }
      }
    }).resize(c, l, {
      fit: u.fit.cover,
      kernel: u.kernel.lanczos3
    });
    !a.includes("home-") && i.watermarkPath && m.composite([
      {
        input: i.watermarkPath,
        ...r
      }
    ]), await m.toFile(a);
  } catch (m) {
    console.error(`Failed to reduce image size of ${e}: ${m}`);
  }
}
async function b(e) {
  console.log(`Deleting all files in ${e}`);
  const a = await h.readdir(e);
  await Promise.all(
    a.map(async (i) => {
      const r = s.join(e, i);
      await h.unlink(r);
    })
  );
}
async function S(e) {
  console.log(`Creating optimized directory in ${e}`);
  try {
    await h.mkdir(s.join(e, "optimized"), { recursive: !0 });
  } catch (a) {
    if (a.code !== "EEXIST")
      throw console.error(`Failed to create directory ${e}: ${a}`), a;
  }
}
async function I(e) {
  console.log(`Creating thumbnails directory in ${e}`);
  try {
    await h.mkdir(s.join(e, "thumbnails"), { recursive: !0 });
  } catch (a) {
    if (a.code !== "EEXIST")
      throw console.error(`Failed to create directory ${e}: ${a}`), a;
  }
}
async function v(e, a, i) {
  console.log(`Creating thumbnail for ${e}`);
  const { width: r, height: n } = await p(e);
  let t = !1;
  r && n && (t = n > r);
  const [o, c] = t ? [null, i.thumbnailSize?.height] : [i.thumbnailSize?.width, null];
  return u(e).resize(o, c, {
    kernel: u.kernel.lanczos3,
    fit: u.fit.cover
  }).webp({
    quality: 100
  }).toFile(a);
}
async function C(e, a, i) {
  console.log(`Renaming files in ${a}`);
  const r = e.map(async (n) => {
    const t = s.join(i.imagesDir, a, n);
    let o = n;
    i.cleanChars?.forEach((l) => {
      typeof l == "string" ? o = o.replace(l, "") : o = o.replace(l.char, l.replaceBy);
    });
    let c = s.join(i.imagesDir, a, o);
    o !== n && y(c) ? (o = o.replace(".jpg", "2.jpg"), c = s.join(i.imagesDir, a, o), await h.rename(t, c)) : await h.rename(t, c);
  });
  return Promise.all(r);
}
async function T(e) {
  await Promise.all(
    e.parentGalleries.map(async (a) => {
      const r = await e.galleries.filter(
        (t) => t.includes(a)
      ).reduce(async (t, o) => {
        const c = await t, l = s.join(e.imagesDir, o), m = JSON.parse(
          await h.readFile(s.join(l, "images.json"), "utf8")
        );
        return e.privateGalleries.includes(o) && m.forEach((g) => {
          delete g.thumbnailPath, delete g.path;
        }), { ...c, [o]: m };
      }, Promise.resolve({})), n = Object.keys(r).reduce((t, o) => {
        const c = r[o].find((l) => !l.portrait);
        return { ...t, [o]: c };
      }, {});
      await h.writeFile(
        s.join(e.imagesDir, a, "cover-images.json"),
        JSON.stringify(n, null, 2)
      );
    })
  );
}
export {
  G as createGalleries
};
