/**
 * Single source of truth for homepage, blog index, and forum section
 * titles and meta descriptions. The SEO server and react-helmet both
 * read this module. Unknown boards added later use metaForSection().
 */
const SUFFIX = ' | Watch Trading Forums';

const HOME_TITLE = 'Buy, Sell & Discuss Watches | Watch Trading Forums';
const HOME_DESCRIPTION =
  'Buy, sell and discuss luxury watches with collectors across the UK and worldwide. Join Watch Trading Forums and post your first listing today.';

const BLOG_TITLE = 'Watch Blog: Guides & Reviews | Watch Trading Forums';
const BLOG_DESCRIPTION =
  'Read watch guides, brand reviews and market notes, with a UK eye on Rolex, Omega and more. Join Watch Trading Forums and post your thoughts.';

const REGIONS = {
  'united-kingdom': { tag: 'UK', label: 'the UK', kind: 'uk' },
  'united-states': { tag: 'US', label: 'the US', kind: 'intl' },
  netherlands: { tag: 'NL', label: 'the Netherlands', kind: 'intl' },
  belgium: { tag: 'BE', label: 'Belgium', kind: 'intl' },
  flanders: { tag: 'BE', label: 'Belgium', kind: 'intl' },
  wallonia: { tag: 'BE', label: 'Belgium', kind: 'intl' },
  canada: { tag: 'CA', label: 'Canada', kind: 'intl' },
  australia: { tag: 'AU', label: 'Australia', kind: 'intl' },
  'new-zealand': { tag: 'NZ', label: 'New Zealand', kind: 'intl' },
  asia: { tag: 'Asia', label: 'Asia', kind: 'asia' },
};

const FEATURED = {
  'new-member-introductions': {
    title: 'New Members: Introduce Yourself | Watch Trading Forums',
    description:
      'New here? Tell collectors in the UK and worldwide what you wear and collect. Say hello, then join Watch Trading Forums and post your introduction.',
  },
  'community-rules': {
    title: 'Forum Rules: Read Before Posting | Watch Trading Forums',
    description:
      'Read the community rules before you buy, sell or post. They keep Watch Trading Forums fair for UK and overseas members. Join, then start a thread.',
  },
  'watch-discussion-forum': {
    title: 'Watch Discussion Forum | Watch Trading Forums',
    description:
      'Talk watches that do not fit a brand or city board, from daily wear to weekend pieces. UK collectors welcome. Join the forum and post a thread.',
  },
  articles: {
    title: 'Watch Articles & News | Watch Trading Forums',
    description:
      'Read watch articles and news, then talk them through with collectors. Coverage runs from Rolex to independents, with a UK view. Join and post a reply.',
  },
  'owners-threads': {
    title: "Owner's Threads & Site News | Watch Trading Forums",
    description:
      'Announcements and threads from the owner of Watch Trading Forums. Catch the latest notes, then join the community and post a reply on the board.',
  },
  'technical-questions': {
    title: 'Technical Watch Help & Advice | Watch Trading Forums',
    description:
      'Ask technical questions about movements, servicing and faults. Members across the UK share practical advice. Join free and post your question today.',
  },
  'watch-repairers': {
    title: 'Watch Repairers: Find & Ask | Watch Trading Forums',
    description:
      'Find independent watch repairers, compare servicing notes and ask who members trust in the UK and abroad. Join the forum and post a recommendation.',
  },
  'fake-or-real': {
    title: 'Fake or Real? Watch Checks | Watch Trading Forums',
    description:
      'Unsure if a watch is genuine? Post clear photos and references for a community check before you buy. UK and overseas members help. Join and post.',
  },
  marketplace: {
    title: 'Watch Marketplace: Buy & Sell | Watch Trading Forums',
    description:
      'Buy, sell and trade luxury watches with members across the UK, Europe, the US and Asia. Browse the local boards, then join free and post a listing.',
  },
  'united-kingdom': {
    title: 'UK Watches: Buy, Sell & Trade | Watch Trading Forums',
    description:
      'The UK marketplace for buying, selling and discussing watches, from London to Scotland. Compare local deals, then join and post your listing today.',
  },
  'united-states': {
    title: 'US Watches: Buy, Sell & Trade | Watch Trading Forums',
    description:
      'Buy and sell watches with members across the United States, state by state. Ask about local deals and shipping, then join and post a listing today.',
  },
  netherlands: {
    title: 'Netherlands Watches: Buy & Sell | Watch Trading Forums',
    description:
      'Buy, sell and discuss watches across the Netherlands, from Amsterdam to the provinces. Dutch and UK collectors welcome. Join and post a listing.',
  },
  belgium: {
    title: 'Belgium Watches: Buy & Sell | Watch Trading Forums',
    description:
      'Buy, sell and discuss luxury watches in Belgium, with collectors who trade across Europe and the UK. Join Watch Trading Forums and post a listing.',
  },
  canada: {
    title: 'Canada Watches: Buy & Sell | Watch Trading Forums',
    description:
      'Buy, sell and discuss watches across Canada, province by province. Members compare prices and trusted sellers. Join the forum and post a listing.',
  },
  australia: {
    title: 'Australia Watches: Buy & Sell | Watch Trading Forums',
    description:
      'Buy, sell and discuss watches across Australia, from Sydney to Perth. Collectors share local prices and photos. Join the forum and post a listing.',
  },
  'new-zealand': {
    title: 'NZ Watches: Buy, Sell & Trade | Watch Trading Forums',
    description:
      'Buy, sell and discuss watches across New Zealand, with collectors who also trade with the UK. Share photos and prices, then join and post today.',
  },
  asia: {
    title: 'Asia Watches: Buy, Sell & Trade | Watch Trading Forums',
    description:
      'Buy, sell and discuss luxury watches across Asia, country by country. Compare dealers and prices with members worldwide. Join and post a listing.',
  },
  'rolex-watches': {
    title: 'Rolex Watches: Buy, Sell & Discuss | Watch Trading Forums',
    description:
      'Talk Submariners, Daytonas and Datejusts, and buy or sell Rolex with collectors in the UK and abroad. Check references, then join and post today.',
  },
  'patek-philippe-watches': {
    title: 'Patek Philippe: Buy, Sell & Trade | Watch Trading Forums',
    description:
      'Discuss Nautilus, Aquanaut and Calatrava pieces, and buy or sell Patek Philippe with care. UK and overseas collectors welcome. Join and post.',
  },
  'audemars-piguet-watches': {
    title: 'Audemars Piguet: Buy & Sell | Watch Trading Forums',
    description:
      'Talk Royal Oaks and other Audemars Piguet references, then buy or sell with members who know the brand. Join Watch Trading Forums and post today.',
  },
  'omega-watches': {
    title: 'Omega Watches: Buy, Sell & Discuss | Watch Trading Forums',
    description:
      'From Speedmasters to Seamasters, buy, sell and discuss Omega with collectors in the UK and worldwide. Compare references, then join and post.',
  },
  'tag-heuer-watches': {
    title: 'TAG Heuer: Buy, Sell & Discuss | Watch Trading Forums',
    description:
      'Talk Carreras, Monacos and Aquaracers, and buy or sell TAG Heuer with fellow collectors. UK members welcome. Join the forum and post a thread.',
  },
  'cartier-watches': {
    title: 'Cartier Watches: Buy & Sell | Watch Trading Forums',
    description:
      'Discuss Tank, Santos and other Cartier watches, then buy or sell with collectors who know the references. Join Watch Trading Forums and post.',
  },
  'jaeger-lecoultre-watches': {
    title: 'Jaeger-LeCoultre: Buy & Sell | Watch Trading Forums',
    description:
      'Talk Reversos, Master Control and other Jaeger-LeCoultre pieces. Buy or sell with careful collectors. Join Watch Trading Forums and post today.',
  },
  'iwc-watches': {
    title: 'IWC Watches: Buy, Sell & Discuss | Watch Trading Forums',
    description:
      'Discuss Pilot, Portugieser and other IWC watches, and buy or sell with members in the UK and abroad. Compare references, then join and post.',
  },
  'panerai-watches': {
    title: 'Panerai Watches: Buy & Sell | Watch Trading Forums',
    description:
      'Talk Luminor and Radiomir references, and buy or sell Panerai with collectors who check the details. Join Watch Trading Forums and post a thread.',
  },
  'tudor-watches': {
    title: 'Tudor Watches: Buy, Sell & Discuss | Watch Trading Forums',
    description:
      'From Black Bay to Pelagos, buy, sell and discuss Tudor with collectors in the UK and worldwide. Share wrist shots, then join and post a listing.',
  },
  'post-your-watch-images': {
    title: 'Post Your Watch Photos | Watch Trading Forums',
    description:
      'Share photos of the watch on your wrist, from daily beaters to grail pieces. UK and worldwide collectors love a good shot. Join and post yours.',
  },
  'on-spotting-fakes': {
    title: 'Spotting Fake Watches | Watch Trading Forums',
    description:
      'Learn the tells of counterfeit watches, from dials to movements, with help from careful collectors. Study the guides, then join and post a question.',
  },
  'diamonds-gemstones': {
    title: 'Diamonds & Gemstones | Watch Trading Forums',
    description:
      'Talk diamond-set bezels, gem-set dials and stone quality on luxury watches. Ask before you buy. Join Watch Trading Forums and post your question.',
  },
  'precious-metals': {
    title: 'Gold & Precious Metals | Watch Trading Forums',
    description:
      'Discuss gold, platinum and other precious metals in watch cases and bracelets. Compare weights and finishes, then join the forum and post today.',
  },
  engravings: {
    title: 'Watch Engravings & Dedications | Watch Trading Forums',
    description:
      'Talk caseback engravings, dedications and personalised watches, and ask what to look for when buying. Join Watch Trading Forums and post a photo.',
  },
  'skeleton-openwork': {
    title: 'Skeleton & Openwork Watches | Watch Trading Forums',
    description:
      'Discuss skeleton and openworked dials, from finishing to what to check before you buy. Collectors in the UK and abroad welcome. Join and post.',
  },
  'special-dials-finishes': {
    title: 'Special Dials & Finishes | Watch Trading Forums',
    description:
      'Talk enamel, meteorite, lacquer and other special dials. Share photos and buying notes with collectors. Join Watch Trading Forums and post yours.',
  },
  'off-topic': {
    title: 'Off Topic Chat | Watch Trading Forums',
    description:
      'Step away from watches for hobbies, life and everything else members fancy talking about. Keep it friendly. Join Watch Trading Forums and post.',
  },
  'forum-support': {
    title: 'Forum Support & Site Help | Watch Trading Forums',
    description:
      'Need a hand using Watch Trading Forums? Ask for help, suggest an improvement or report a problem. Join and post so a moderator can pick it up.',
  },
  'site-help': {
    title: 'Site Help & Suggestions | Watch Trading Forums',
    description:
      'Stuck on the site, or have an idea to improve it? Post here and the team will take a look. UK and overseas members welcome. Join and post today.',
  },
  'report-user': {
    title: 'Report a User | Watch Trading Forums',
    description:
      'Seen rude, suspicious or rule-breaking behaviour? Report the member with a clear note so moderators can review it. Join and post the details.',
  },
  'petition-ban': {
    title: 'Ban Appeals | Watch Trading Forums',
    description:
      'Appealing a ban or suspension? Explain what happened, calmly and in full, so the team can review it. Join Watch Trading Forums and post your case.',
  },
  'hacked-accounts': {
    title: 'Hacked Accounts Help | Watch Trading Forums',
    description:
      'Think your account was hacked? Please post what changed and how to reach you so the team can help you recover it. Join and send the details today.',
  },
};

function hash(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function withBrand(lead) {
  const clean = String(lead).replace(/\s+/g, ' ').trim();
  if (`${clean}${SUFFIX}`.length <= 60) return `${clean}${SUFFIX}`;
  const room = 60 - SUFFIX.length;
  let cut = clean.slice(0, room);
  if (cut.length < clean.length) cut = cut.replace(/\s+\S*$/, '');
  cut = cut.replace(/[\s,:|&-]+$/g, '').trim();
  return `${cut}${SUFFIX}`;
}

function inRange(text) {
  return text.length >= 140 && text.length <= 160;
}

function pickDescription(candidates) {
  const unique = [...new Set(candidates.map((item) => item.replace(/\s+/g, ' ').trim()))];
  const good = unique.filter(inRange);
  if (good.length) {
    good.sort((a, b) => Math.abs(a.length - 150) - Math.abs(b.length - 150) || a.length - b.length);
    return good[0];
  }
  const pads = [' Ask the board.', ' Come and say hello.', ' Collectors welcome.'];
  const unders = unique.filter((item) => item.length < 140).sort((a, b) => b.length - a.length);
  for (const base of unders) {
    for (const pad of pads) {
      const next = `${base}${pad}`;
      if (inRange(next)) return next;
    }
  }
  return null;
}

const SHORT_NAME = {
  'United Arab Emirates': 'UAE',
  'Australian Capital Territory': 'ACT',
  'Newfoundland and Labrador': 'Newfoundland',
  'Prince Edward Island': 'PEI',
  'Northwest Territories': 'NWT',
  'Myanmar (Burma)': 'Myanmar',
};

function placeTitle(name, tag) {
  const names = SHORT_NAME[name] ? [name, SHORT_NAME[name]] : [name];
  const options = [];
  for (const label of names) {
    if (tag) {
      options.push(
        `${label}, ${tag}: Buy & Sell Watches`,
        `${label}, ${tag}: Buy, Sell & Trade`,
        `${label}, ${tag}: Buy & Sell`,
        `${label}: Buy & Sell`,
        `${label}, ${tag} Watch Forum`,
      );
    } else {
      options.push(
        `${label}: Buy, Sell & Discuss`,
        `${label} Forum: Buy & Sell`,
        `${label} Watches`,
        label,
      );
    }
  }
  for (const lead of options) {
    if (`${lead}${SUFFIX}`.length <= 60 && !/\s\S{1,3}$/.test(lead.slice(-4))) return `${lead}${SUFFIX}`;
  }
  for (const lead of options) {
    if (`${lead}${SUFFIX}`.length <= 60) return `${lead}${SUFFIX}`;
  }
  return withBrand(options[options.length - 1]);
}

function regionalDescription(name, region, slug) {
  const { label } = region;
  let candidates = [];
  if (region.kind === 'uk') {
    candidates = [
      `Buy, sell and discuss luxury watches in ${name} with collectors across the UK. Compare local prices and photos, then join and post a listing today.`,
      `${name} is a UK board for buying and selling watches. Ask about dealers, postage and references, then join free and post your listing.`,
      `Looking for a watch in ${name}? Talk UK members before you buy or sell, from Rolex to vintage pieces. Join the forum and post a thread.`,
      `Trade watches in ${name} with members across Britain. Share wrist shots, sold prices and honest advice. Join Watch Trading Forums and post.`,
      `Collectors in ${name} buy, sell and discuss luxury watches with the wider UK community. Check a reference, then join and post your listing.`,
      `${name} listings, questions and wrist shots from UK watch collectors. Browse the board, join Watch Trading Forums, and post what you have.`,
    ];
  } else if (region.kind === 'asia') {
    candidates = [
      `Buy, sell and discuss luxury watches in ${name}. Collectors across Asia and the UK compare dealers and prices. Join the forum and post a listing.`,
      `${name} is the Asia board for buying and selling watches. Ask about local dealers and references, then join and post your listing today.`,
      `Looking for a watch in ${name}? Talk members across Asia and the UK before you buy or sell. Join Watch Trading Forums and post a thread.`,
      `Trade watches in ${name} with collectors who know the Asian market and ship to the UK. Share photos and prices, then join and post.`,
      `Discuss ${name} watch prices, trusted sellers and new listings with members worldwide. Join Watch Trading Forums and post on this board.`,
    ];
  } else {
    candidates = [
      `Buy, sell and discuss luxury watches in ${name}, ${label}. Compare local prices and photos with members, including UK collectors. Join and post a listing.`,
      `${name} buyers and sellers list luxury watches across ${label}. Ask about local dealers and references, then join free and post a listing.`,
      `Looking for a watch in ${name}? Talk ${label} members, and collectors in the UK, before you buy or sell. Join the forum and post today.`,
      `Trade watches in ${name}, ${label}. Share wrist shots, sold prices and honest advice. Join Watch Trading Forums and post your listing.`,
      `Collectors in ${name} buy, sell and discuss watches with members in ${label} and the UK. Check a reference, then join and post a thread.`,
      `${name}, ${label}: listings, questions and photos from watch collectors. Browse the board, join Watch Trading Forums, and post what you have.`,
    ];
  }
  const start = hash(slug) % candidates.length;
  const ordered = candidates.slice(start).concat(candidates.slice(0, start));
  return pickDescription(ordered) || pickDescription(candidates);
}

function brandDescription(name) {
  const brand = name.replace(/ Watches$/, '');
  return pickDescription([
    `Buy, sell and discuss ${brand} with collectors in the UK and worldwide. Compare references and prices, then join Watch Trading Forums and post.`,
    `Talk ${brand} references, wrist shots and fair prices with members at home and abroad. Ask a question, then join the forum and post today.`,
    `${brand} buyers and sellers compare watches, from current pieces to older references. UK collectors welcome. Join and post your listing.`,
    `Whether you own or want a ${brand}, share photos and buying notes here. Members in the UK and overseas will chime in. Join and post a thread.`,
  ]);
}

function fallbackMeta(section) {
  const name = section.name || 'Watches';
  const title = placeTitle(name, null);
  const description = pickDescription([
    `Discuss ${name} with watch collectors in the UK and worldwide. Ask questions, share photos and trade with care. Join the forum and post a thread.`,
    `${name} on Watch Trading Forums: buy, sell and talk it through with members in the UK and abroad. Join free and post your question today.`,
    `Collectors talk ${name} here, from first questions to watches for sale. UK and overseas members welcome. Join Watch Trading Forums and post.`,
  ]);
  return {
    title,
    description:
      description ||
      `Discuss ${name} with UK and worldwide collectors. Ask a question, share a photo and trade with care. Join the forum and post a thread today.`,
  };
}

function metaForSection(section, parent) {
  if (!section) return fallbackMeta({ name: 'Watches', slug: 'watches' });
  if (FEATURED[section.slug]) return FEATURED[section.slug];
  const region = parent && REGIONS[parent.slug];
  if (region) {
    const description = regionalDescription(section.name, region, section.slug);
    if (description) return { title: placeTitle(section.name, region.tag), description };
  }
  if (/-watches$/.test(section.slug || '') || /watches/i.test(section.name || '')) {
    const description = brandDescription(section.name);
    if (description) {
      const brand = String(section.name).replace(/ Watches$/, '');
      return { title: placeTitle(brand, null), description };
    }
  }
  return fallbackMeta(section);
}

module.exports = {
  SUFFIX,
  HOME_TITLE,
  HOME_DESCRIPTION,
  BLOG_TITLE,
  BLOG_DESCRIPTION,
  FEATURED,
  metaForSection,
};
