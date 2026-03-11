import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Chip, Stack, Skeleton } from '@mui/material';
import axios from 'axios';
import './NewsMarquee.css';

const API = import.meta.env.VITE_API_URL || '';

const FALLBACK = [
  { title: 'Markets steady as global cues stay mixed', summary: 'Indices hold gains amid cautious optimism.', source: 'Reuters', impact: 'Neutral', image: '' },
  { title: 'FII outflows weigh on benchmark indices', summary: 'Foreign investors continue selling in emerging markets.', source: 'Bloomberg', impact: 'Bearish', image: '' },
  { title: 'RBI policy holds rates, signals easing bias', summary: 'Central bank keeps repo rate unchanged, dovish commentary.', source: 'Economic Times', impact: 'Bullish', image: '' },
  { title: 'IT sector gains on strong dollar', summary: 'Rupee depreciation boosts export earnings outlook.', source: 'Mint', impact: 'Bullish', image: '' },
  { title: 'Crude oil surges on supply concerns', summary: 'OPEC cuts and geopolitical risks lift Brent above $85.', source: 'CNBC', impact: 'Bearish', image: '' },
  { title: 'Auto sector sees strong monthly sales', summary: 'Passenger vehicle sales up 12% YoY in latest data.', source: 'MoneyControl', impact: 'Bullish', image: '' },
];

const impactConfig = {
  Bullish:  { bg: '#dcfce7', color: '#15803d' },
  Bearish:  { bg: '#fee2e2', color: '#b91c1c' },
  Neutral:  { bg: '#e5e7eb', color: '#374151' },
};

const IMG_FALLBACK = 'https://images.pexels.com/photos/210600/pexels-photo-210600.jpeg?auto=compress&cs=tinysrgb&w=400';

/* ─── Drag-scroll hook ─── */
function useDragScroll(ref) {
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    state.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.classList.add('dragging');
  }, [ref]);

  const onMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    state.current.isDown = false;
    el.classList.remove('dragging');
  }, [ref]);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el || !state.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = state.current.scrollLeft - (x - state.current.startX) * 1.5;
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseUp);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseUp);
    };
  }, [ref, onMouseDown, onMouseMove, onMouseUp]);
}

/* ─── Single Card ─── */
const NewsCard = ({ article, onClick }) => {
  const imp = impactConfig[article.impact] || impactConfig.Neutral;

  return (
    <div className="news-card-marquee" onClick={onClick}>
      <Box
        component="img"
        src={article.image || IMG_FALLBACK}
        alt={article.title}
        onError={(e) => { e.target.src = IMG_FALLBACK; }}
        sx={{ width: '100%', height: 110, objectFit: 'cover' }}
      />
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.6, flex: 1, overflow: 'hidden' }}>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
          {article.source}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600, color: '#111827', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {article.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#6b7280', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {article.summary}
        </Typography>
        <Chip
          size="small"
          label={article.impact}
          sx={{
            mt: 'auto', alignSelf: 'flex-start', height: 20, fontSize: 10,
            bgcolor: imp.bg, color: imp.color, fontWeight: 600,
          }}
        />
      </Box>
    </div>
  );
};

/* ─── Auto-scroll Row (infinite CSS marquee) ─── */
const MarqueeRow = ({ items, direction = 'left' }) => {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-row-auto">
      <div className={`marquee-row-track scroll-${direction}`}>
        {doubled.map((a, i) => (
          <NewsCard
            key={`${direction}-${i}`}
            article={a}
            onClick={() => a.url && window.open(a.url, '_blank', 'noopener')}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Drag Row ─── */
const DragRow = ({ items }) => {
  const ref = useRef(null);
  useDragScroll(ref);
  return (
    <div className="marquee-row" ref={ref}>
      {items.map((a, i) => (
        <NewsCard
          key={`drag-${i}`}
          article={a}
          onClick={() => a.url && window.open(a.url, '_blank', 'noopener')}
        />
      ))}
    </div>
  );
};

/* ─── Loading skeleton row ─── */
const SkeletonRow = () => (
  <Box sx={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rounded" width={280} height={300} sx={{ flexShrink: 0, borderRadius: '12px' }} />
    ))}
  </Box>
);

/* ═══════ Main Component ═══════ */
const NewsMarquee = ({ symbol }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    axios
      .get(`${API}/news/${symbol}`)
      .then((res) => {
        const list = res.data?.articles || [];
        setArticles(list.length > 0 ? list : FALLBACK);
      })
      .catch(() => setArticles(FALLBACK))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="marquee-container">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  const mid = Math.ceil(articles.length / 2);
  const row1 = articles.slice(0, mid);
  const row2 = articles.slice(mid);

  return (
    <div className="marquee-container">
      {row1.length >= 3 ? <MarqueeRow items={row1} direction="left" /> : <DragRow items={row1} />}
      {row2.length >= 3 ? <MarqueeRow items={row2} direction="right" /> : <DragRow items={row2} />}
    </div>
  );
};

export default NewsMarquee;
