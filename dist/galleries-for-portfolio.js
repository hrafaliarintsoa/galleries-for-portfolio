import s from "path";
import D from "image-size";
import u from "sharp";
import { promises as h, existsSync as y } from "node:fs";
async function G(e) {
  console.log("Optimizing images....");
  try {
    await Promise.all(
      e.galleries.map(async (a) => {
        const i = s.join(e.imagesDir, a), o = await h.readdir(i), n = s.join(i + "");
        await C(o, a, e);
        const t = await h.readdir(i);
        await S(n), await I(n), await b(s.join(n, "/optimized")), await b(s.join(n, "/thumbnails")), await Promise.all(
          t.map(async (l) => {
            if (d(l)) {
              const m = s.join(i, l), g = z(l, e), f = s.join(
                i + "/optimized",
                w(g)
              ), j = s.join(
                i + "/thumbnails",
                w(g)
              );
              await P(m, f, e), await v(m, j, e);
            }
          })
        );
        const r = await F(
          z(t, e),
          i,
          a,
          e
        ), c = JSON.stringify(r, null, 2);
        await h.writeFile(s.join(i, "images.json"), c);
      })
    ), await T(e);
  } catch (a) {
    console.error("Error optimizing images:", a);
  }
}
function z(e, a) {
  if (Array.isArray(e) && e.length)
    return e.map((o) => {
      if (!d(o))
        return o;
      let n = o;
      return a.renameOptions.charsToRename.forEach((t) => {
        n = n.replace(t, a.renameOptions.renameBy);
      }), n;
    });
  if (!d(e))
    return e;
  let i = e;
  return a.renameOptions.charsToRename.forEach((o) => {
    i = i.replace(o, a.renameOptions.renameBy);
  }), i;
}
function d(e) {
  const a = s.extname(e);
  return a === ".jpg" || a === ".jpeg" || a === ".png";
}
function w(e) {
  return e.replace(s.extname(e), ".webp");
}
async function p(e) {
  return console.log(`Getting image size for ${e}`), new Promise((a, i) => {
    D(e, (o, n) => {
      o ? i(o) : a(n);
    });
  });
}
async function F(e, a, i, o) {
  console.log(`Creating image objects for ${i}`);
  const n = [];
  for (const t of e)
    if (d(t)) {
      const r = s.join(a, "thumbnails", t), c = s.join(a, "optimized", t), l = O({}, i), m = await p(c.replace(".jpg", ".webp")), g = await p(r.replace(".jpg", ".webp"));
      let f = !1;
      g.width && g.height && (f = g.height > g.width);
      const j = i.includes("home-") ? $(t, i, o) : i;
      n.push({
        name: t.replace(".jpg", ""),
        path: s.join(o.imagesAssetsDir, i, "optimized", w(t)),
        thumbnailPath: s.join(
          o.imagesAssetsDir,
          i,
          "thumbnails",
          w(t)
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
function $(e, a, i) {
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
async function P(e, a, i) {
  console.log(`Reducing image size of ${e}`), console.log(`Destination: ${a}`);
  const o = { gravity: "southeast" }, { width: n, height: t } = await p(e);
  let r = !1;
  n && t && (r = t > n);
  const [c, l] = r ? [i.optimizedSize?.height, i.optimizedSize?.width] : [i.optimizedSize?.width, i.optimizedSize?.height];
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
    a.includes("home-") || m.composite([
      {
        input: i.watermarkPath,
        ...o
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
      const o = s.join(e, i);
      await h.unlink(o);
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
  const { width: o, height: n } = await p(e);
  let t = !1;
  o && n && (t = n > o);
  const [r, c] = t ? [null, i.thumbnailSize?.height] : [i.thumbnailSize?.width, null];
  return u(e).resize(r, c, {
    kernel: u.kernel.lanczos3,
    fit: u.fit.cover
  }).webp({
    quality: 100
  }).toFile(a);
}
async function C(e, a, i) {
  console.log(`Renaming files in ${a}`);
  const o = e.map(async (n) => {
    const t = s.join(i.imagesDir, a, n);
    let r = n;
    r = r.replace(/-\d+(?=\.[^.]+$)/, ""), i.cleanChars?.forEach((l) => {
      typeof l == "string" ? r = r.replace(l, "") : r = r.replace(l.char, l.replaceBy);
    });
    let c = s.join(i.imagesDir, a, r);
    r !== n && y(c) ? (r = r.replace(".jpg", "2.jpg"), c = s.join(i.imagesDir, a, r), await h.rename(t, c)) : await h.rename(t, c);
  });
  return Promise.all(o);
}
async function T(e) {
  await Promise.all(
    e.parentGalleries.map(async (a) => {
      const o = await e.galleries.filter(
        (t) => t.includes(a)
      ).reduce(async (t, r) => {
        const c = await t, l = s.join(e.imagesDir, r), m = JSON.parse(
          await h.readFile(s.join(l, "images.json"), "utf8")
        );
        return e.privateGalleries.includes(r) && m.forEach((g) => {
          delete g.thumbnailPath, delete g.path;
        }), { ...c, [r]: m };
      }, Promise.resolve({})), n = Object.keys(o).reduce((t, r) => {
        const c = o[r].find((l) => !l.portrait);
        return { ...t, [r]: c };
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
