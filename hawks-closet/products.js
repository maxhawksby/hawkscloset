/* ═══════════════════════════════════════
   PRODUCTS DATA
   Each product: { id, name, price, sold, size, era, material, cond, desc, img }
   img: path relative to index.html — swap in real photos as you shoot them
═══════════════════════════════════════ */
var PRODUCTS = [
  {
    id: '1',
    name: 'Palace World Rally Team Jacket',
    price: 680,
    sold: false,
    size: 'M',
    era: '2023',
    material: 'Cotton Canvas',
    cond: 'Deadstock',
    desc: 'Palace x World Rally Team collab. Deadstock, never worn. Blue embroidered graphics across chest and sleeves. One of the most sought-after Palace drops of the year.',
    img: 'images/placeholder.png'
  },
  {
    id: '2',
    name: 'Vintage Carhartt Detroit Jacket',
    price: 285,
    sold: false,
    size: 'M',
    era: '1994',
    material: 'Duck Canvas / Blanket Lined',
    cond: 'Excellent Used',
    desc: 'OG Detroit in brown blanket-lined duck canvas. Original Carhartt label. All snaps intact. Natural fading on collar and cuffs adds character.',
    img: 'images/placeholder.png'
  },
  {
    id: '3',
    name: 'Stone Island Shadow Project Jacket',
    price: 890,
    sold: false,
    size: 'M',
    era: '2011',
    material: 'Membrana 3L TC',
    cond: 'Excellent Used',
    desc: 'Stone Island technical shell from the 2011 archive. Compass badge on left sleeve. All pockets functional. Retail $1,400.',
    img: 'images/placeholder.png'
  },
  {
    id: '4',
    name: 'Helmut Lang AW98 Bondage Trousers',
    price: 1200,
    sold: false,
    size: 'M',
    era: '1998',
    material: '100% Wool',
    cond: 'Excellent Used',
    desc: 'From the seminal AW98 runway. Double bondage straps with original metal hardware. Full provenance. One of the most important archive pieces available.',
    img: 'images/placeholder.png'
  },
  {
    id: '5',
    name: 'Raf Simons AW01 Riot Riot Riot Bomber',
    price: 4800,
    sold: true,
    size: 'M',
    era: '2001',
    material: 'Nylon Shell',
    cond: 'Excellent Used',
    desc: 'AW01 Riot Riot Riot — the most important collection in menswear history. Nylon bomber with contrast stripe sleeves. Rarely surfaces. Full archive provenance.',
    img: 'images/placeholder.png'
  },
  {
    id: '6',
    name: 'Comme des Garcons SHIRT Polka Dot',
    price: 520,
    sold: false,
    size: 'M',
    era: '2004',
    material: '100% Cotton Poplin',
    cond: 'Excellent Used',
    desc: 'CDG SHIRT polka dot poplin from 2004. Signature all-over dot print on black. CDG woven label at collar. One careful owner.',
    img: 'images/placeholder.png'
  },
  {
    id: '7',
    name: 'Stussy 1993 Tribe Check Flannel',
    price: 320,
    sold: false,
    size: 'M',
    era: '1993',
    material: '100% Cotton Flannel',
    cond: 'Excellent Used',
    desc: 'Original 1993 Tribe check flannel from the Stussy archive. Old label. Unworn. The rarest colourway from this era.',
    img: 'images/placeholder.png'
  },
  {
    id: '8',
    name: 'Nike ACG Polartec Half-Zip Fleece',
    price: 380,
    sold: false,
    size: 'M',
    era: '1997',
    material: 'Polartec Fleece',
    cond: 'Excellent Used',
    desc: '1997 Nike ACG half-zip in teal. Original hang tag present. All-Conditions Gear label. One of the most coveted ACG colourways ever made.',
    img: 'images/placeholder.png'
  },
  {
    id: '9',
    name: "Arc'teryx Alpha SV Shell",
    price: 780,
    sold: false,
    size: 'M',
    era: '2016',
    material: 'GORE-TEX Pro 3L',
    cond: 'Excellent Used',
    desc: 'Alpha SV — the most technically advanced shell ever made. Helmet-compatible hood, pit zips, all YKK waterproof zips. Used twice.',
    img: 'images/placeholder.png'
  },
  {
    id: '10',
    name: 'Champion Reverse Weave 1985',
    price: 280,
    sold: false,
    size: 'M',
    era: '1985',
    material: 'Reverse Weave Cotton',
    cond: 'Excellent Used',
    desc: '1985 Reverse Weave in heather grey. Original C logo embroidery. Bar tack stitching throughout. The best Champion colourway ever made.',
    img: 'images/placeholder.png'
  },
  {
    id: '11',
    name: 'Kapital Boro Indigo Denim Jacket',
    price: 1400,
    sold: true,
    size: 'M',
    era: '2018',
    material: 'Boro Repaired Denim',
    cond: 'Excellent Used',
    desc: 'Kapital Boro indigo denim with hand-applied boro repairs. Each patch hand-stitched with sashiko embroidery. Museum quality. One of a kind.',
    img: 'images/placeholder.png'
  },
  {
    id: '12',
    name: 'Needles Butterfly Track Jacket',
    price: 680,
    sold: false,
    size: 'M',
    era: '2020',
    material: '100% Polyester',
    cond: 'Excellent Used',
    desc: 'Needles butterfly track jacket. Gold and crimson embroidered butterfly on left chest. Contrast maroon panels. Extremely rare colourway.',
    img: 'images/placeholder.png'
  }
];

/* ═══════════════════════════════════════
   PAGINATION — Load More
   PAGE_SIZE items shown initially.
   Each "Load More" appends another batch.
═══════════════════════════════════════ */
var PAGE_SIZE     = 12;
var _activeList   = null;   // current sorted/filtered list
var _loadedCount  = 0;      // how many cells are currently visible

function _makeCell(p) {
  var cell = document.createElement('div');
  cell.className = 'grid-cell' + (p.sold ? ' sold' : '');
  cell.dataset.id       = p.id;
  cell.dataset.price    = p.price;
  cell.dataset.name     = p.name;
  cell.dataset.sold     = p.sold;
  cell.dataset.size     = p.size;
  cell.dataset.era      = p.era;
  cell.dataset.material = p.material;
  cell.dataset.cond     = p.cond;
  cell.dataset.desc     = p.desc;
  cell.dataset.img      = p.img;
  cell.onclick          = function() { openProduct(this); };
  cell.innerHTML =
    '<div class="grid-img">' +
      '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
      '<div class="sold-tag"><span>Sold</span></div>' +
    '</div>' +
    '<div class="grid-info">' +
      '<p class="grid-name">' + p.name + '</p>' +
      '<p class="grid-price">$' + p.price + '</p>' +
    '</div>';
  return cell;
}

function _syncLoadMore() {
  var wrap = document.getElementById('loadMoreWrap');
  var remaining = _activeList.length - _loadedCount;
  if (!wrap) return;
  if (remaining > 0) {
    wrap.style.display = 'flex';
    var btn = wrap.querySelector('.load-more-btn');
    if (btn) btn.textContent = 'Load More (' + remaining + ' remaining)';
  } else {
    wrap.style.display = 'none';
  }
}

/* Full reset — called on initial render and after sort/search */
function renderProducts(list) {
  _activeList  = list || PRODUCTS;
  _loadedCount = 0;
  var grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  if (_activeList.length === 0) {
    grid.innerHTML = '<p class="grid-empty">No pieces match that search.</p>';
    _syncLoadMore();
    return;
  }
  loadMore();
}

/* Append next PAGE_SIZE items — called by "Load More" button */
function loadMore() {
  var grid  = document.getElementById('productGrid');
  var batch = _activeList.slice(_loadedCount, _loadedCount + PAGE_SIZE);
  batch.forEach(function(p) { grid.appendChild(_makeCell(p)); });
  _loadedCount += batch.length;
  _syncLoadMore();
}
