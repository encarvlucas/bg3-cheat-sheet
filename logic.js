/* ============================================================
    EDIT ME: points of interest
    ------------------------------------------------------------
    TAGS     : tag id -> label shown on chips/filters. Add your own,
                e.g.  camp:"Camp"  and give it a colour in the CSS:
                .camp { --c: #0a7; }
    SUBACTS : subact id -> label shown in the selector under the Act tabs.
                Optional: an id with no label is shown as its id.
    DATA     : acts -> areas -> items.
    area     : { id, subact, name, items }
                - id must be unique; subact groups areas inside an act.
    item     : { id, title, tags, requires, tooltip, loot, subtasks }
                - id       : unique and fixed. Progress is stored under it, so
                            keep it if you reword the title.
                - title    : text. Accepts links: [label](https://example.com)
                - tags     : space-separated tag ids, optional ('')
                - requires : ids of tasks to do first, optional. Shown as links
                            under the item; clicking one jumps to it.
                - tooltip  : optional plain text with clarifying info. Shows an ⓘ button
                            on the row; the text appears on hover, focus or tap.
                - loot     : optional array of notable loot, shown in a chest popover:
                            [{ url, r, note, alias }] 
                            url: http(s) link, the name opens it in a new tab, used to show the name if no name is present.
                            r: rarity c|u|r|v|l (common, uncommon, rare, very rare, legendary),
                            note: optional text,
                            alias: optional text for alternate names used in filtering
                - subtasks : optional nested entries, same fields.
                            Shown indented, checkboxes are independent of the parent.
    Trailing commas are fine.
  ============================================================ */
// const TAGS = TAGS // From data.js file

// const SUBACTS = SUBACTS // From data.js file

// const DATA = DATA // From data.js file

/* ======================== end of editable data ======================== */

// ---------- Code (no need to edit below unless you're changing behaviour) ----------

// localStorage key where all profiles and progress are saved
const KEY = 'bg3_checklist_v1'
// Shorthand for document.getElementById
const $ = (id) => document.getElementById(id)
// Escape HTML special characters so titles can't inject markup
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// Escape, then extract item name from url
const escUrl = (s) => {
  const m = String(s).match(/\/wiki\/([^/?#]+)/)?.[1]
  if (!m) return undefined
  let t = m
  try {
    t = decodeURIComponent(m)
  } catch (e) {}
  return esc(t.replace(/_/g, ' '))
}
// Escape, then turn [label](https://...) into a clickable link
const fmt = (s) => esc(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
// Strip [label](url) down to just the label (used where links make no sense)
const plain = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
// Trash can icon for the skip button
const TRASH =
  '<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>'
// Treasure chest icon for the notable-loot button
const CHEST =
  '<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11V9a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2"/><rect x="3" y="11" width="18" height="9" rx="1.5"/><path d="M7.5 11v9M16.5 11v9"/><rect x="10.5" y="9.5" width="3" height="4.5" rx=".7" fill="currentColor"/></svg>'
// Star icon for the wishlist button (filled through CSS when pressed)
const STAR =
  '<svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
// Make sure every task id is unique: a duplicate gets '_' appended until it is free
const seen = {}
const uniq = (k) => {
  while (seen[k]) k += '_'
  return (seen[k] = k)
}

// Build the item tree. A.list is the flat list (parents and subtasks) used for counts.
// BY maps a task id -> { n: task, ar: its area, act: its act index }; used for "requires" links and jumping.
// mk(area, actIndex, rawItem) converts one raw item from DATA into a normalised task node:
//   t = title, g = array of tag ids, k = unique id, req = array of required task ids, sub = subtask nodes
const BY = {}
const mk = (A, ai, o) => {
  const t = o.title || o.name || ''
  const n = {
    t,
    // tags can be an array or a space-separated string
    g: Array.isArray(o.tags)
      ? o.tags
      : String(o.tags || '')
          .split(/\s+/)
          .filter(Boolean),
    // use the explicit id; if missing, derive one from the area id + title
    k: uniq(
      o.id ||
        A.id +
          ':' +
          t
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40),
    ),
    // optional notable loot: [{ url, r, note, alias }]
    loot: Array.isArray(o.loot) ? o.loot.filter((x) => x && x.url) : [],
    // optional clarifying text shown in a tooltip
    tip: o.tooltip ? String(o.tooltip) : '',
    // requires can be an array of ids or a space-separated string
    req: (o.requires?.split && o.requires?.split(/\s+/).filter(Boolean)) || o.requires || [],
  }
  BY[n.k] = { n, ar: A, act: ai }
  A.list.push(n)
  n.sub = (o.subtasks || []).map((x) => mk(A, ai, x))
  return n
}
// Label for a subact id (falls back to the id itself)
const subLabel = (id) => SUBACTS[id] || id
// Normalise DATA into ACTS: each act has areas (with a task tree) and its list of subacts
const ACTS = DATA.map((a, ai) => {
  const areas = a.areas.map((ar) => {
    const A = { id: ar.id, sub: ar.subact || '', name: ar.name, list: [] }
    A.tree = ar.items.map((x) => mk(A, ai, x))
    return A
  })
  return { name: a.name, areas, subs: [...new Set(areas.map((x) => x.sub).filter(Boolean))] }
})
// Flat list of all areas across all acts
const AREAS = ACTS.flatMap((a) => a.areas)
// Tab indexes: one per act, then Loot, then Options
const LOOT_TAB = ACTS.length
const OPTS_TAB = ACTS.length + 1
// Flat list of every notable item: one entry per (task, item), in act > area > task order.
// n = task, ar = its area, ai = its act index, x = raw loot item, name = display name, hay = lowercase search text
const LOOTS = ACTS.flatMap((a, ai) =>
  a.areas.flatMap((ar) =>
    ar.list.flatMap((n) =>
      n.loot.map((x) => {
        const name = escUrl(x.url)
        return { n, ar, ai, x, name, hay: [name, x.alias, x.note, plain(n.t), ar.name].filter(Boolean).join(' ').toLowerCase() }
      }),
    ),
  ),
)

// ---------- Tooltips ----------
// One floating element is reused for every ⓘ / chest button (hover, keyboard focus or tap)
// Rarity id -> [label, colour]; the loot popover is always dark so these colours read in both themes
const RARITY = {
  c: ['Common', '#f1ffff'],
  u: ['Uncommon', '#01ae2d'],
  r: ['Rare', '#01bfff'],
  v: ['Very Rare', '#d10172'],
  l: ['Legendary', '#b7861f'],
}
// Popover HTML for a task's notable loot (all text escaped)
const lootHtml = (n) =>
  `<div class="lh">${CHEST}<span>Notable items</span></div>` +
  n.loot
    .map((x) => {
      const r = RARITY[String(x.r || '').toLowerCase()]
      const link = /^https?:\/\//i.test(x.url || '')
      const label = (P().wish[x.url] ? '<span class="lw" title="On your wishlist">★</span> ' : '') + escUrl(x.url)
      const name = link ? `<a class="ln" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<span class="ln">${label}</span>`
      return `<div class="li"${r ? ` style="--rc:${r[1]}"` : ''}>${name}${r ? `<small class="lr">${r[0]}</small>` : ''}${x.note ? `<span class="lo">${esc(x.note)}</span>` : ''}</div>`
    })
    .join('')
const tipEl = document.createElement('div')
tipEl.id = 'tip'
tipEl.setAttribute('role', 'tooltip')
tipEl.hidden = true
document.body.appendChild(tipEl)
// The popover stays open while the pointer is over the button or the popover itself (so links can be clicked)
let tipTimer
const hideTip = () => {
  clearTimeout(tipTimer)
  tipEl.hidden = true
}
const hideSoon = () => {
  clearTimeout(tipTimer)
  tipTimer = setTimeout(hideTip, 200)
}
const inTip = (e) => e.target.closest && e.target.closest('#tip')
const showTip = (b) => {
  clearTimeout(tipTimer)
  const n = b.dataset.loot && BY[b.dataset.loot] && BY[b.dataset.loot].n
  tipEl.className = n ? 'loot' : ''
  if (n) tipEl.innerHTML = lootHtml(n)
  else tipEl.textContent = b.dataset.tip
  // Measure from the top-left corner, so its size never depends on where it was last shown
  tipEl.style.left = tipEl.style.top = '0px'
  tipEl.hidden = false
  // Layout viewport (what position: fixed uses): innerWidth/innerHeight can differ on mobile and include the scrollbar
  const vw = document.documentElement.clientWidth,
    vh = document.documentElement.clientHeight
  const r = b.getBoundingClientRect(),
    w = tipEl.offsetWidth,
    h = tipEl.offsetHeight
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi))
  // Beside the icon: to its right, or to its left if there is no room there
  const x = r.right + 8 + w <= vw - 8 ? r.right + 8 : r.left - w - 8
  if (x >= 8) {
    tipEl.style.left = x + 'px'
    // Loot popovers are top-aligned with the icon, plain tips are centred on it; both stay inside the viewport
    tipEl.style.top = clamp(n ? r.top - 6 : r.top + r.height / 2 - h / 2, 8, vh - h - 8) + 'px'
    return
  }
  // No room on either side (narrow screens): centred above the icon, or below it if there is no room above
  tipEl.style.left = clamp(r.left + r.width / 2 - w / 2, 8, vw - w - 8) + 'px'
  tipEl.style.top = clamp(r.top - h - 6 >= 8 ? r.top - h - 6 : r.bottom + 6, 8, vh - h - 8) + 'px'
}
const tipBtn = (e) => e.target.closest && e.target.closest('.tipbtn, .lootbtn')
document.addEventListener('mouseover', (e) => (tipBtn(e) ? showTip(tipBtn(e)) : inTip(e) && clearTimeout(tipTimer)))
document.addEventListener('mouseout', (e) => (tipBtn(e) || inTip(e)) && hideSoon())
document.addEventListener('focusin', (e) => (tipBtn(e) ? showTip(tipBtn(e)) : inTip(e) || hideTip()))
document.addEventListener('focusout', (e) => tipBtn(e) && hideTip())
document.addEventListener('click', (e) => (tipBtn(e) ? showTip(tipBtn(e)) : inTip(e) || hideTip()))
document.addEventListener('keydown', (e) => e.key == 'Escape' && hideTip())
window.addEventListener('scroll', hideTip, true)

// ---------- State ----------
// S = { cur: current profile name, profiles: { name: profile } }, loaded from localStorage
let S
try {
  S = JSON.parse(localStorage.getItem(KEY))
} catch (e) {}
if (!S || !S.profiles) S = { cur: 'Default', profiles: {} }
// A fresh profile:
//   done: task id -> 1 when checked      col: area id -> true when collapsed
//   hideDone: hide completed tasks       off: tag id -> true when that tag filter is active (name is historical)
//   tab: selected act (or Options)       sub: act index -> selected subact id
//   or: tag filters match ANY active tag (OR) instead of ALL of them (AND)
//   skip: task id -> 1 when skipped (uncompletable); skipped tasks are left out of the counts
//   lact / lsub: act index and subact id selected on the Loot tab ('' = all)
//   wish: loot url -> 1 when that item is wishlisted (a preference, so it survives 'Reset this profile')
const blank = () => ({ done: {}, skip: {}, col: {}, hideDone: false, off: {}, or: false, tab: 0, sub: {}, lact: '', lsub: '', wish: {} })
// Current profile (missing fields are filled in from blank(), so old saves keep working)
const P = () => (S.profiles[S.cur] = Object.assign(blank(), S.profiles[S.cur]))
// Persist state; ignore errors (e.g. storage blocked in private mode)
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S))
  } catch (e) {}
}
// With no active tag filters everything shows; otherwise AND (default) needs every active tag, OR needs at least one
const vis = (p, it) => {
  // Active tag filters
  const fil = Object.entries(p.off).reduce((acc, [x, y]) => {
    if (y) return acc.concat(x)
    return acc
  }, [])
  // OR mode: tasks that contain at least one active filter
  if (p.or) return !fil.length || fil.some((z) => it.g.includes(z))
  // AND mode: only tasks that contain all active filters
  return fil.every((z) => it.g.includes(z))
}

// HTML for the "Requires: ..." line under a task; ticks the ones already done
const reqs = (p, n) =>
  n.req.length
    ? `<div class="req">Requires: ${n.req
        .map((k) =>
          BY[k]
            ? `<a href="#" data-goto="${esc(k)}" class="${p.done[k] ? 'met' : p.skip[k] ? 'skipped' : ''}">${p.done[k] ? '✓ ' : p.skip[k] ? '✗ ' : ''}${esc(plain(BY[k].n.t))}</a>`
            : `<span title="No task has this id">unknown “${esc(k)}”</span>`,
        )
        .join(', ')}</div>`
    : ''

// HTML for the Options tab: profile management and import/export
function opts() {
  return `<section class="area pad"><h3>Profiles</h3><p><select id="prof">${Object.keys(S.profiles)
    .map((n) => `<option ${n == S.cur ? 'selected' : ''}>${esc(n)}</option>`)
    .join('')}</select>
<button data-act="add">Add</button> <button data-act="ren">Rename</button> <button data-act="del">Delete</button></p>
<h3>Data</h3><p><button data-act="exp">Export JSON</button> <button data-act="imp">Import JSON</button>
<button data-act="reset">Reset this profile</button></p>
<p class="mu">Progress is saved in this browser's localStorage (key <code>${KEY}</code>). Clearing site data erases it, so export a backup now and then.</p>
<input type="file" id="file" accept=".json" hidden></section>`
}

// Loot tab: one row per notable item (an item found in several tasks shows once per task).
// The checkbox mirrors the state of the task it comes from: ticked = done, crossed = skipped.
// Clicking a card jumps to the task in its own act tab; the name opens the wiki page; ⓘ shows the note.
function lootView(p, q) {
  const ai = ACTS[p.lact] ? +p.lact : -1
  const subs = [...new Set(ACTS.filter((_, i) => ai < 0 || i == ai).flatMap((a) => a.subs))]
  const cs = subs.includes(p.lsub) ? p.lsub : ''
  // Tab counter: all items from tasks that are not skipped
  const live = LOOTS.filter((r) => !p.skip[r.n.k])
  const n = live.length,
    d = live.filter((r) => p.done[r.n.k]).length
  const filters =
    `<label class="mu">Act <select id="lact"><option value="">All</option>${ACTS.map((a, i) => `<option value="${i}" ${i == ai ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>` +
    (subs.length
      ? `<label class="mu">Subact <select id="lsub"><option value="">All</option>${subs.map((s) => `<option value="${esc(s)}" ${s == cs ? 'selected' : ''}>${esc(subLabel(s))}</option>`).join('')}</select></label>`
      : '')
  const rows = LOOTS.filter((r) => (ai < 0 || r.ai == ai) && (!cs || r.ar.sub == cs) && (!p.hideDone || !(p.done[r.n.k] || p.skip[r.n.k])) && (!q || r.hay.includes(q)))
  // Wishlisted items are pulled out into their own section at the top; the rest is grouped by area
  const wished = (r) => !!p.wish[r.x.url]
  const wrows = rows.filter(wished)
  // Group consecutive rows by area
  const groups = []
  let g
  rows
    .filter((r) => !wished(r))
    .forEach((r) => {
      if (!g || g.ar !== r.ar) groups.push((g = { ar: r.ar, ai: r.ai, rows: [] }))
      g.rows.push(r)
    })
  const item = ({ n, x, name }) => {
    const k = String(x.r || '').toLowerCase(),
      r = RARITY[k],
      dn = !!p.done[n.k],
      sk = !!p.skip[n.k],
      link = /^https?:\/\//i.test(x.url || '')
    // The whole card jumps to the task; only the name (wiki link) do something else
    const w = !!p.wish[x.url]
    return `<li class="lootcard ${dn ? 'done' : sk ? 'skip' : ''} ${r ? 'r-' + k : ''}${w ? ' wish' : ''}" data-goto="${esc(n.k)}"><div class="row"><div class="lootrow">
    <input type="checkbox" disabled tabindex="-1" aria-label="${dn ? 'Task done' : sk ? 'Task skipped' : 'Task not done'}" ${dn ? 'checked' : ''}>
    ${link ? `<a class="ln" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="Open wiki page">${name}</a>` : `<span class="ln">${name}</span>`}${r ? `<em class="tg">${r[0]}</em>` : ''}
    <a href="#" class="lt" data-goto="${esc(n.k)}" title="Show task">${esc(plain(n.t))}</a></div>
    ${x.note ? `<button type="button" class="tipbtn" data-tip="${esc(x.note)}" aria-label="${esc(x.note)}">ⓘ</button>` : ''}
    <button type="button" class="star" data-wish="${esc(x.url)}" aria-pressed="${w}" title="${w ? 'Remove from wishlist' : 'Add to wishlist'}" aria-label="${w ? 'Remove from wishlist' : 'Add to wishlist'}">${STAR}</button></div></li>`
  }
  // One collapsible section: header with done counter, then its cards
  const section = (id, head, list, cls = '') => {
    const open = q || !p.col[id],
      v = list.filter((r) => !p.skip[r.n.k]),
      c = v.filter((r) => p.done[r.n.k]).length
    return `<section class="area ${cls}"><h3 data-col="${esc(id)}"><span>${open ? '▾' : '▸'} ${head}</span>
    <b class="${v.length && c == v.length ? 'ok' : ''}">${v.length && c == v.length ? 'Done' : c + '/' + v.length}</b></h3>${open ? '<ul>' + list.map(item).join('') + '</ul>' : ''}</section>`
  }
  const body = rows.length
    ? `<p class="mu">${rows.length} of ${LOOTS.length} items${wrows.length ? ` · ${wrows.length} wishlisted` : ''}</p>` +
      (wrows.length ? section('loot:*wishlist', `<span class="ws">★</span> Wishlist`, wrows, 'wishlist') : '') +
      groups.map(({ ar, ai, rows }) => section('loot:' + ar.id, `${esc(ar.name)} <small class="mu">${esc(ACTS[ai].name)}</small>`, rows)).join('')
    : '<p class="mu">No items match the current filters.</p>'
  return { body, filters, n, d }
}

// Re-draw the whole page from the current state. Called after every change.
function render() {
  hideTip()
  const p = P(),
    q = $('q').value.trim().toLowerCase()
  if (p.tab > OPTS_TAB) p.tab = 0
  const onOpts = p.tab == OPTS_TAB,
    onLoot = p.tab == LOOT_TAB
  // tabs/subs/body collect HTML; all/alld are overall totals (tasks / done) for the progress bar
  let tabs = '',
    subs = '',
    body = '',
    all = 0,
    alld = 0
  // Loop over acts: build the tab button, and (for the selected act) the subact selector and areas
  ACTS.forEach((a, i) => {
    // n/d = tasks/done in this act, h = this act's area HTML
    let n = 0,
      d = 0,
      h = ''
    // cs = selected subact (or '' for all), sc = per-subact task/done counts
    const cs = a.subs.includes(p.sub[i]) ? p.sub[i] : '',
      sc = {}
    a.areas.forEach((ar) => {
      // v = tasks passing the tag filters and not skipped, c = how many of those are done (counts ignore search/hide-completed)
      const v = ar.list.filter((it) => vis(p, it) && !p.skip[it.k]),
        c = v.filter((it) => p.done[it.k]).length
      n += v.length
      d += c
      const s = (sc[ar.sub] = sc[ar.sub] || { n: 0, d: 0 })
      s.n += v.length
      s.d += c
      // Only build HTML for the selected act, and only for areas in the selected subact
      if (i != p.tab || (cs && ar.sub != cs)) return
      // A row shows if it matches the filters, or if any of its subtasks does.
      const row = (it) => {
        const sub = it.sub.map(row).join('')
        const ok =
          vis(p, it) &&
          (!p.hideDone || !(p.done[it.k] || p.skip[it.k])) &&
          (!q || (it.t + ' ' + ar.name + ' ' + it.loot.map((x) => [escUrl(x.url), x.alias].filter(Boolean).join(' ')).join(' ')).toLowerCase().includes(q))
        if (!ok && !sub) return ''
        const sk = !!p.skip[it.k]
        const wl = it.loot.some((x) => p.wish[x.url])
        return `<li class="${p.done[it.k] ? 'done' : sk ? 'skip' : ''}${wl ? ' wish' : ''}"><div class="row"><label>
    <input type="checkbox" data-k="${esc(it.k)}" ${p.done[it.k] ? 'checked' : ''}><span class="tx">${fmt(it.t)}</span>
    ${it.g.map((t) => `<em class="tag tg ${esc(t)}">${esc(TAGS[t] || t)}</em>`).join('')}</label>
    ${it.tip ? `<button type="button" class="tipbtn" data-tip="${esc(it.tip)}" aria-label="${esc(it.tip)}">ⓘ</button>` : ''}
    ${it.loot.length ? `<button type="button" class="lootbtn" data-loot="${esc(it.k)}" aria-label="Notable items (${it.loot.length})">${CHEST}</button>` : ''}
    <button class="del" data-skip="${esc(it.k)}" aria-pressed="${sk}" title="${sk ? 'Restore task' : 'Skip task (uncompletable)'}" aria-label="${sk ? 'Restore task' : 'Skip task'}">${TRASH}</button></div>${reqs(p, it)}${sub ? `<ul class="sub">${sub}</ul>` : ''}</li>`
      }
      // Skip areas with nothing to show; collapsed areas show only their header (a search forces them open)
      const rows = ar.tree.map(row).join('')
      if (!rows) return
      const open = q || !p.col[ar.id],
        id = esc(ar.id)
      h += `<section class="area"><h3 data-col="${id}"><span>${open ? '▾' : '▸'} ${esc(ar.name)}</span>
    <span><button data-all="${id}">Check all</button> <button data-none="${id}">Clear</button>
    <b class="${c == v.length ? 'ok' : ''}">${c == v.length ? 'Done' : c + '/' + v.length}</b></span></h3>`
      if (open) h += '<ul>' + rows + '</ul>'
      h += '</section>'
    })
    all += n
    alld += d
    tabs += `<button data-tab="${i}" class="${i == p.tab ? 'on' : ''}">${esc(a.name)} <small>${d}/${n}</small></button>`
    if (i == p.tab) {
      body = h || '<p class="mu">Nothing to show with the current filters.</p>'
      if (a.subs.length > 1)
        subs =
          `<button data-sub="" class="${cs ? '' : 'on'}">All <small>${d}/${n}</small></button>` +
          a.subs.map((s) => `<button data-sub="${esc(s)}" class="${s == cs ? 'on' : ''}">${esc(subLabel(s))} <small>${sc[s].d}/${sc[s].n}</small></button>`).join('')
    }
  })
  // Loot tab: its own act/subact selectors replace the subact buttons
  const lv = lootView(p, q)
  if (onLoot) {
    body = lv.body
    subs = lv.filters
  }
  // Write everything into the page
  $('tabs').innerHTML =
    tabs +
    `<button data-tab="${LOOT_TAB}" class="${onLoot ? 'on' : ''}">Loot <small>${lv.d}/${lv.n}</small></button>` +
    `<button data-tab="${OPTS_TAB}" class="${onOpts ? 'on' : ''}">Options</button>`
  $('q').placeholder = onLoot ? 'Filter loot…' : 'Filter points of interest…'
  $('tags').hidden = onLoot
  $('subs').innerHTML = onOpts ? '' : subs
  $('subs').hidden = onOpts || !subs
  $('tools').hidden = onOpts
  // Tag filter chips (struck through when off), the toggle-all button and the AND/OR switch
  $('tags').innerHTML =
    Object.keys(TAGS)
      .map((t) => `<button class="chip tg ${esc(t)} ${!p.off[t] ? 'off' : 'on'}" data-tag="${esc(t)}">${esc(TAGS[t])}</button>`)
      .join('') +
    `<button class="chip" data-tag-all="1" title="Toggle all tag filters">${Object.keys(TAGS).every((t) => p.off[t]) ? 'Disable all' : 'Enable all'}</button>` +
    `<button class="mode" role="switch" aria-checked="${!!p.or}" data-mode="1" title="Match tasks with ALL active tags (AND) or ANY of them (OR)"><span class="${p.or ? '' : 'on'}">AND</span><span class="${p.or ? 'on' : ''}">OR</span></button>`
  $('hd').checked = p.hideDone
  $('app').innerHTML = onOpts ? opts() : body
  $('tot').textContent = alld + '/' + all
  $('pb').style.width = (all ? (100 * alld) / all : 0) + '%'
}

// Jump to a task: switch act, expand its area, drop filters that would hide it, then highlight it.
function jump(k) {
  const b = BY[k],
    p = P()
  if (!b) return
  p.tab = b.act
  // Check current subact tab for the act of the referenced task, if its '' or undefined, leave it
  // otherwise, set the subact of referenced task
  if (!!p.sub[b.act]) p.sub[b.act] = b.ar.sub
  p.col[b.ar.id] = false
  $('q').value = ''
  if (p.done[k] || p.skip[k]) p.hideDone = false
  if (!vis(p, b.n)) Object.keys(p.off).forEach((t) => b.n.g.includes(t) || delete p.off[t])
  save()
  render()
  const box = [...document.querySelectorAll('input[data-k]')].find((x) => x.dataset.k == k)
  const li = box && box.closest('li')
  if (!li) return
  li.scrollIntoView({ block: 'center' })
  li.classList.add('flash')
  setTimeout(() => li.classList.remove('flash'), 1600)
}

// Handlers for the buttons on the Options tab: add/rename/delete profile, reset, export/import
function act(a) {
  const names = Object.keys(S.profiles)
  if (a == 'add') {
    const n = (prompt('Profile name') || '').trim()
    if (n && !S.profiles[n]) S.cur = n
  }
  if (a == 'ren') {
    const n = (prompt('New name', S.cur) || '').trim()
    if (n && !S.profiles[n]) {
      S.profiles[n] = S.profiles[S.cur]
      delete S.profiles[S.cur]
      S.cur = n
    }
  }
  if (a == 'del' && names.length > 1 && confirm('Delete profile “' + S.cur + '”?')) {
    delete S.profiles[S.cur]
    S.cur = Object.keys(S.profiles)[0]
  }
  if (a == 'reset' && confirm('Reset all progress in this profile?')) Object.assign(P(), { done: {}, skip: {} })
  if (a == 'exp') {
    const el = document.createElement('a')
    el.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' }))
    el.download = 'bg3-checklist-' + new Date().toISOString().slice(0, 10) + '.json'
    el.click()
    URL.revokeObjectURL(el.href)
    return
  }
  if (a == 'imp') return $('file').click()
  save()
  render()
}

// One click handler for every button. Buttons carry data-* attributes saying what they do;
// d(attr) finds the clicked element (or an ancestor) with that attribute.
document.onclick = (e) => {
  // Wiki links (item names) keep their own behaviour, they must not trigger a card's jump
  if (e.target.closest('a.ln, .tipbtn')) return
  const d = (x) => e.target.closest('[' + x + ']'),
    p = P()
  let el
  // Wishlist star (checked first: it lives inside a card that would otherwise jump to the task)
  if ((el = d('data-wish'))) {
    const u = el.dataset.wish
    if (p.wish[u]) delete p.wish[u]
    else p.wish[u] = 1
  } else if ((el = d('data-goto'))) {
    e.preventDefault()
    return jump(el.dataset.goto)
  } else if ((el = d('data-tab'))) p.tab = +el.dataset.tab
  else if ((el = d('data-sub'))) p.sub[p.tab] = el.dataset.sub
  // Toggle all tag filters: if every tag is on, turn them all off; otherwise turn them all on
  else if ((el = d('data-tag-all'))) {
    const allOn = Object.keys(TAGS).every((t) => p.off[t])
    Object.keys(TAGS).forEach((t) => (p.off[t] = !allOn))
  } else if ((el = d('data-tag'))) p.off[el.dataset.tag] = !p.off[el.dataset.tag]
  // AND / OR switch for the tag filters
  else if ((el = d('data-mode'))) p.or = !p.or
  // Skip / restore a task (trash button): skipping clears its checkmark
  else if ((el = d('data-skip'))) {
    const k = el.dataset.skip
    if (p.skip[k]) delete p.skip[k]
    else {
      p.skip[k] = 1
      delete p.done[k]
    }
  }
  // Check all / Clear: only affects tasks visible under the current tag filters (Check all leaves skipped tasks alone)
  else if ((el = d('data-all') || d('data-none'))) {
    const ar = AREAS.find((x) => x.id == (el.dataset.all || el.dataset.none))
    ar.list.filter((it) => vis(p, it) && !(el.dataset.all && p.skip[it.k])).forEach((it) => (el.dataset.all ? (p.done[it.k] = 1) : delete p.done[it.k]))
  }
  // Collapse / expand an area
  else if ((el = d('data-col'))) p.col[el.dataset.col] = !p.col[el.dataset.col]
  // Options tab buttons
  else if ((el = d('data-act'))) return act(el.dataset.act)
  else return // not a button we care about
  save()
  render()
}

// Handler for checkboxes, the profile dropdown and the import file picker
document.onchange = (e) => {
  const t = e.target,
    p = P()
  if (t.dataset.k) {
    // task checkbox
    // checking a skipped task restores it
    if (t.checked) {
      p.done[t.dataset.k] = 1
      delete p.skip[t.dataset.k]
    } else delete p.done[t.dataset.k]
  } else if (t.id == 'lact') {
    p.lact = t.value
    p.lsub = ''
  } else if (t.id == 'lsub') p.lsub = t.value
  else if (t.id == 'hd') p.hideDone = t.checked
  else if (t.id == 'prof') S.cur = t.value
  // Import: read the chosen JSON file and replace all profiles after confirmation
  else if (t.id == 'file' && t.files[0]) {
    const fr = new FileReader()
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result)
        if (!d.profiles || !confirm('Replace all current profiles with the imported file?')) return
        S = d
        S.cur = S.profiles[S.cur] ? S.cur : Object.keys(S.profiles)[0]
        save()
        render()
      } catch (err) {
        alert('Invalid file: ' + err.message)
      }
    }
    fr.readAsText(t.files[0])
    return
  } else return
  save()
  render()
  // The selectors are redrawn, so give focus back to the one just used
  if (t.id == 'lact' || t.id == 'lsub') $(t.id)?.focus()
}

// Re-render as the search box changes, then draw the page for the first time
$('q').oninput = render
render()
