"use strict";Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const o=require("path"),y=require("image-size"),h=require("sharp"),m=require("node:fs");async function D(e){console.log("Optimizing images....");try{await Promise.all(e.galleries.map(async t=>{const i=o.join(e.imagesDir,t),s=await m.promises.readdir(i),n=o.join(i+"");await T(s,t,e);const a=await m.promises.readdir(i);await S(n),await v(n),await b(o.join(n,"/optimized")),await b(o.join(n,"/thumbnails")),await Promise.all(a.map(async l=>{if(d(l)){const g=o.join(i,l),u=z(l,e),p=o.join(i+"/optimized",f(u)),j=o.join(i+"/thumbnails",f(u));await $(g,p,e),await I(g,j,e)}}));const r=await F(z(a,e),i,t,e),c=JSON.stringify(r,null,2);await m.promises.writeFile(o.join(i,"images.json"),c)})),await C(e)}catch(t){console.error("Error optimizing images:",t)}}function z(e,t){if(Array.isArray(e)&&e.length)return e.map(s=>{if(!d(s))return s;let n=s;return t.renameOptions.charsToRename.forEach(a=>{n=n.replace(a,t.renameOptions.renameBy)}),n});if(!d(e))return e;let i=e;return t.renameOptions.charsToRename.forEach(s=>{i=i.replace(s,t.renameOptions.renameBy)}),i}function d(e){const t=o.extname(e);return t===".jpg"||t===".jpeg"||t===".png"}function f(e){return e.replace(o.extname(e),".webp")}async function w(e){return console.log(`Getting image size for ${e}`),new Promise((t,i)=>{y(e,(s,n)=>{s?i(s):t(n)})})}async function F(e,t,i,s){console.log(`Creating image objects for ${i}`);const n=[];for(const a of e)if(d(a)){const r=o.join(t,"thumbnails",a),c=o.join(t,"optimized",a),l=P({},i),g=await w(c.replace(".jpg",".webp")),u=await w(r.replace(".jpg",".webp"));let p=!1;u.width&&u.height&&(p=u.height>u.width);const j=i.includes("home-")?O(a,i,s):i;n.push({name:a.replace(".jpg",""),path:o.join(s.imagesAssetsDir,i,"optimized",f(a)),thumbnailPath:o.join(s.imagesAssetsDir,i,"thumbnails",f(a)),thumbnailDimensions:u,optimizedDimensions:g,portrait:p,galleryId:j,file:a.replace(".jpg",""),alt:l,parentId:i})}return n}function O(e,t,i){const n=i.galleries.map(a=>o.join(i.imagesDir,a,"optimized",e.replace(".jpg",".webp"))).filter(a=>!a.includes(t)).find(a=>m.existsSync(a));if(n){const a=o.normalize(n);return i.galleries.find(c=>a.includes(o.normalize(c)))||null}return null}function P(e,t){let i=`Hajaniaina Rafaliarintsoa ${t}`;return e.DigitalCreationDate&&(i+=` ${e.DigitalCreationDate}`),i}async function $(e,t,i){console.log(`Reducing image size of ${e}`),console.log(`Destination: ${t}`);const s={gravity:"southeast"},{width:n,height:a}=await w(e);let r=!1;n&&a&&(r=a>n);const[c,l]=r?[i.optimizedSize?.height,i.optimizedSize?.width]:[i.optimizedSize?.width,i.optimizedSize?.height];try{const g=h(e).withMetadata({exif:{IFD0:{Copyright:i.copyright||new Date().getFullYear().toString()}}}).resize(c,l,{fit:h.fit.cover,kernel:h.kernel.lanczos3});t.includes("home-")||g.composite([{input:i.watermarkPath,...s}]),await g.toFile(t)}catch(g){console.error(`Failed to reduce image size of ${e}: ${g}`)}}async function b(e){console.log(`Deleting all files in ${e}`);const t=await m.promises.readdir(e);await Promise.all(t.map(async i=>{const s=o.join(e,i);await m.promises.unlink(s)}))}async function S(e){console.log(`Creating optimized directory in ${e}`);try{await m.promises.mkdir(o.join(e,"optimized"),{recursive:!0})}catch(t){if(t.code!=="EEXIST")throw console.error(`Failed to create directory ${e}: ${t}`),t}}async function v(e){console.log(`Creating thumbnails directory in ${e}`);try{await m.promises.mkdir(o.join(e,"thumbnails"),{recursive:!0})}catch(t){if(t.code!=="EEXIST")throw console.error(`Failed to create directory ${e}: ${t}`),t}}async function I(e,t,i){console.log(`Creating thumbnail for ${e}`);const{width:s,height:n}=await w(e);let a=!1;s&&n&&(a=n>s);const[r,c]=a?[null,i.thumbnailSize?.height]:[i.thumbnailSize?.width,null];return h(e).resize(r,c,{kernel:h.kernel.lanczos3,fit:h.fit.cover}).webp({quality:100}).toFile(t)}async function T(e,t,i){console.log(`Renaming files in ${t}`);const s=e.map(async n=>{const a=o.join(i.imagesDir,t,n);let r=n;r=r.replace(/-\d+(?=\.[^.]+$)/,""),i.cleanChars?.forEach(l=>{typeof l=="string"?r=r.replace(l,""):r=r.replace(l.char,l.replaceBy)});let c=o.join(i.imagesDir,t,r);r!==n&&m.existsSync(c)?(r=r.replace(".jpg","2.jpg"),c=o.join(i.imagesDir,t,r),await m.promises.rename(a,c)):await m.promises.rename(a,c)});return Promise.all(s)}async function C(e){await Promise.all(e.parentGalleries.map(async t=>{const s=await e.galleries.filter(a=>a.includes(t)).reduce(async(a,r)=>{const c=await a,l=o.join(e.imagesDir,r),g=JSON.parse(await m.promises.readFile(o.join(l,"images.json"),"utf8"));return e.privateGalleries.includes(r)&&g.forEach(u=>{delete u.thumbnailPath,delete u.path}),{...c,[r]:g}},Promise.resolve({})),n=Object.keys(s).reduce((a,r)=>{const c=s[r].find(l=>!l.portrait);return{...a,[r]:c}},{});await m.promises.writeFile(o.join(e.imagesDir,t,"cover-images.json"),JSON.stringify(n,null,2))}))}exports.createGalleries=D;