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
    item     : { id, title, tags, requires, subtasks }
                - id       : unique and fixed. Progress is stored under it, so
                            keep it if you reword the title.
                - title    : text. Accepts links: [label](https://example.com)
                - tags     : space-separated tag ids, optional ('')
                - requires : ids of tasks to do first, optional. Shown as links
                            under the item; clicking one jumps to it.
                - subtasks : optional nested entries, same fields.
                            Shown indented, checkboxes are independent of the parent.
    Trailing commas are fine.
  ============================================================ */
const TAGS = {
  boss: 'Boss',
  npc: 'Companion/Ally',
  quest: 'Main Quest',
  loot: 'Loot',
  buff: 'Perm. Buff',
  prereq: 'Prerequisite',
  opt: 'Optional',
}

const SUBACTS = {
  wilderness: 'Wilderness',
  grove: 'Emerald Grove',
  goblins: 'Goblin Camp',
  risen: 'Risen Road',
  underdark: 'Underdark',
  creche: 'Mountain Pass',
  shadow: 'Shadow-Cursed Lands',
  'lower-city': 'Lower City',
  'upper-city': 'Upper City',
}

// const DATA = DATA // From data.js file

/* ======================== end of editable data ======================== */

// ---------- Code (no need to edit below unless you're changing behaviour) ----------

// localStorage key where all profiles and progress are saved
const KEY = 'bg3_checklist_v1'
// Shorthand for document.getElementById
const $ = (id) => document.getElementById(id)
// Escape HTML special characters so titles can't inject markup
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// Escape, then turn [label](https://...) into a clickable link
const fmt = (s) => esc(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
// Strip [label](url) down to just the label (used where links make no sense)
const plain = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
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
    // requires can be an array of ids or a space-separated string
    req: (o.requires?.split && o.requires?.split(' ')) || o.requires || [],
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
const blank = () => ({ done: {}, col: {}, hideDone: false, off: {}, or: false, tab: 0, sub: {} })
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
            ? `<a href="#" data-goto="${esc(k)}" class="${p.done[k] ? 'met' : ''}">${p.done[k] ? '✓ ' : ''}${esc(plain(BY[k].n.t))}</a>`
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

// Re-draw the whole page from the current state. Called after every change.
function render() {
  const p = P(),
    q = $('q').value.trim().toLowerCase()
  if (p.tab > ACTS.length) p.tab = 0
  const onOpts = p.tab == ACTS.length
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
      // v = tasks passing the tag filters, c = how many of those are done (counts ignore search/hide-completed)
      const v = ar.list.filter((it) => vis(p, it)),
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
        const ok = vis(p, it) && (!p.hideDone || !p.done[it.k]) && (!q || (it.t + ' ' + ar.name).toLowerCase().includes(q))
        if (!ok && !sub) return ''
        return `<li class="${p.done[it.k] ? 'done' : ''}"><label>
    <input type="checkbox" data-k="${esc(it.k)}" ${p.done[it.k] ? 'checked' : ''}><span class="tx">${fmt(it.t)}</span>
    ${it.g.map((t) => `<em class="tag tg ${esc(t)}">${esc(TAGS[t] || t)}</em>`).join('')}</label>${reqs(p, it)}${sub ? `<ul class="sub">${sub}</ul>` : ''}</li>`
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
  // Write everything into the page
  $('tabs').innerHTML = tabs + `<button data-tab="${ACTS.length}" class="${onOpts ? 'on' : ''}">Options</button>`
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
  p.sub[b.act] = b.ar.sub
  p.col[b.ar.id] = false
  $('q').value = ''
  if (p.done[k]) p.hideDone = false
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
  if (a == 'reset' && confirm('Reset all progress in this profile?')) P().done = {}
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
  const d = (x) => e.target.closest('[' + x + ']'),
    p = P()
  let el
  if ((el = d('data-goto'))) {
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
  // Check all / Clear: only affects tasks visible under the current tag filters
  else if ((el = d('data-all') || d('data-none'))) {
    const ar = AREAS.find((x) => x.id == (el.dataset.all || el.dataset.none))
    ar.list.filter((it) => vis(p, it)).forEach((it) => (el.dataset.all ? (p.done[it.k] = 1) : delete p.done[it.k]))
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
    if (t.checked) p.done[t.dataset.k] = 1
    else delete p.done[t.dataset.k]
  } else if (t.id == 'hd') p.hideDone = t.checked
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
}

// Re-render as the search box changes, then draw the page for the first time
$('q').oninput = render
render()
