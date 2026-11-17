import React from 'react';
import { ThoughtItem } from '../types';

interface ThoughtIllustrationProps {
  item: ThoughtItem;
}

export const ThoughtIllustration: React.FC<ThoughtIllustrationProps> = ({
  item,
}) => {
  if (item.category === 'colors') {
    return (
      <div
        className="w-36 h-36 rounded-full mx-auto transition-all duration-1000 flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${item.accentHex}88, ${item.accentHex}28 65%, transparent 100%)`,
          boxShadow: `0 0 60px ${item.accentHex}33`,
        }}
        aria-hidden="true"
      >
        <div
          className="w-20 h-20 rounded-full border border-white/10"
          style={{ backgroundColor: `${item.accentHex}66` }}
        />
      </div>
    );
  }

  const stroke = '#c9c2da';

  const renderShape = () => {
    switch (item.illustrationKey) {
      case 'apple':
        return (
          <g>
            <path
              d="M60 36 C48 34, 34 45, 35 64 C36 82, 47 93, 55 92 C58 92, 60 90, 60 90 C60 90, 62 92, 65 92 C73 93, 84 82, 85 64 C86 45, 72 34, 60 36 Z"
              fill="rgba(184,174,220,0.08)"
              stroke={stroke}
              strokeWidth="1.6"
            />
            <path d="M60 36 C60 28, 63 23, 67 21" stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M61 29 C67 24, 74 26, 73 31 C70 33, 64 32, 61 29 Z" fill="rgba(184,174,220,0.12)" stroke={stroke} strokeWidth="1.3" />
          </g>
        );
      case 'bicycle':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="35" cy="74" r="15" />
            <circle cx="85" cy="74" r="15" />
            <path d="M35 74 L54 74 L70 52 L48 52 Z" />
            <path d="M70 52 L85 74" />
            <path d="M48 52 L44 43 L39 43" />
            <path d="M70 52 L73 41 L80 41" />
          </g>
        );
      case 'mountain':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round">
            <path d="M18 86 L46 42 L64 68 L76 50 L102 86 Z" fill="rgba(184,174,220,0.07)" />
            <path d="M38 54 L46 58 L54 54" />
            <path d="M70 59 L76 62 L82 59" />
          </g>
        );
      case 'candle':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <rect x="49" y="50" width="22" height="40" rx="3" fill="rgba(184,174,220,0.08)" />
            <path d="M40 90 L80 90" />
            <path d="M60 50 L60 44" />
            <path d="M60 27 C65 34, 65 41, 60 43 C55 41, 55 34, 60 27 Z" fill="rgba(218,200,165,0.22)" />
          </g>
        );
      case 'chair':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M42 28 L42 90" />
            <path d="M42 32 L74 32 L74 62" />
            <path d="M42 46 L74 46" />
            <path d="M42 62 L78 62 L78 90" />
            <path d="M49 62 L49 86" />
            <path d="M71 62 L71 86" />
          </g>
        );
      case 'umbrella':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M24 58 C26 37, 42 28, 60 28 C78 28, 94 37, 96 58 C88 53, 80 53, 72 58 C64 53, 56 53, 48 58 C40 53, 32 53, 24 58 Z" fill="rgba(184,174,220,0.08)" />
            <path d="M60 24 L60 84 C60 90, 69 91, 70 84" />
          </g>
        );
      case 'cup':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M36 46 L76 46 L73 78 C72 84, 66 87, 56 87 C46 87, 40 84, 39 78 Z" fill="rgba(184,174,220,0.08)" />
            <path d="M76 52 C86 52, 87 69, 75 71" />
            <path d="M30 89 L84 89" />
          </g>
        );
      case 'watermelon':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M26 56 A34 34 0 0 0 94 56 Z" fill="rgba(184,174,220,0.08)" />
            <path d="M32 56 A28 28 0 0 0 88 56" />
            <circle cx="49" cy="67" r="1.2" fill={stroke} />
            <circle cx="60" cy="72" r="1.2" fill={stroke} />
            <circle cx="71" cy="66" r="1.2" fill={stroke} />
          </g>
        );
      case 'clock':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <circle cx="60" cy="60" r="30" fill="rgba(184,174,220,0.07)" />
            <path d="M60 60 L60 42" />
            <path d="M60 60 L73 66" />
            <circle cx="60" cy="60" r="2" fill={stroke} />
          </g>
        );
      case 'football':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6">
            <circle cx="60" cy="60" r="28" fill="rgba(184,174,220,0.07)" />
            <polygon points="60,48 70,55 66,67 54,67 50,55" />
            <path d="M60 48 L60 32 M70 55 L86 49 M66 67 L77 82 M54 67 L43 82 M50 55 L34 49" />
          </g>
        );
      case 'tree':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M60 92 L60 58" />
            <circle cx="60" cy="46" r="22" fill="rgba(184,174,220,0.08)" />
            <path d="M60 70 L50 60 M60 66 L70 57" />
          </g>
        );
      case 'spoon':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <ellipse cx="60" cy="39" rx="11" ry="15" fill="rgba(184,174,220,0.08)" />
            <path d="M60 54 L60 94" strokeWidth="2.2" />
          </g>
        );
      case 'lighthouse':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M49 90 L53 42 L67 42 L71 90 Z" fill="rgba(184,174,220,0.08)" />
            <rect x="52" y="32" width="16" height="10" />
            <path d="M50 32 L60 22 L70 32" />
            <path d="M32 90 L88 90" />
          </g>
        );
      case 'pillow':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6">
            <path
              d="M28 45 C42 41, 78 41, 92 45 C95 55, 95 69, 92 79 C78 83, 42 83, 28 79 C25 69, 25 55, 28 45 Z"
              fill="rgba(184,174,220,0.08)"
            />
            <path d="M46 62 C54 66, 66 66, 74 62" strokeOpacity="0.5" />
          </g>
        );
      case 'window':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6">
            <rect x="34" y="28" width="52" height="64" rx="2" fill="rgba(184,174,220,0.06)" />
            <path d="M60 28 L60 92 M34 60 L86 60" />
          </g>
        );
      case 'paper':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round">
            <path d="M38 28 L72 28 L82 38 L82 92 L38 92 Z" fill="rgba(184,174,220,0.08)" />
            <path d="M72 28 L72 38 L82 38" />
          </g>
        );
      case 'flower':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M60 92 L60 56" />
            <circle cx="60" cy="46" r="5" fill="rgba(218,200,165,0.22)" />
            <circle cx="60" cy="34" r="6" />
            <circle cx="60" cy="58" r="6" />
            <circle cx="48" cy="46" r="6" />
            <circle cx="72" cy="46" r="6" />
          </g>
        );
      case 'teapot':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <ellipse cx="58" cy="64" rx="22" ry="18" fill="rgba(184,174,220,0.08)" />
            <path d="M44 48 L72 48" />
            <circle cx="58" cy="42" r="3" />
            <path d="M36 62 L24 52" />
            <path d="M80 56 C90 56, 90 72, 80 72" />
          </g>
        );
      case 'elephant':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M32 72 L32 88 M44 72 L44 88 M66 72 L66 88 M76 72 L76 88" />
            <path d="M28 60 C28 42, 68 40, 74 52 C82 52, 88 58, 88 68 C88 76, 84 82, 80 82" fill="rgba(184,174,220,0.07)" />
            <path d="M28 60 L28 72 L76 72" />
            <ellipse cx="68" cy="57" rx="7" ry="10" />
          </g>
        );
      case 'turtle':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M32 66 C32 45, 76 45, 76 66 Z" fill="rgba(184,174,220,0.08)" />
            <path d="M76 62 C85 57, 92 60, 90 66 C87 70, 79 68, 76 66" />
            <path d="M38 66 L34 78 M68 66 L72 78" />
          </g>
        );
      case 'owl':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <ellipse cx="60" cy="60" rx="20" ry="26" fill="rgba(184,174,220,0.08)" />
            <circle cx="52" cy="50" r="5" />
            <circle cx="68" cy="50" r="5" />
            <path d="M58 56 L60 60 L62 56" />
            <path d="M44 38 L49 42 M76 38 L71 42" />
          </g>
        );
      case 'whale':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M24 64 C28 45, 62 42, 78 55 C86 60, 92 50, 96 46 C94 56, 94 64, 98 70 C89 67, 84 64, 76 67 C60 76, 26 74, 24 64 Z" fill="rgba(184,174,220,0.08)" />
          </g>
        );
      case 'deer':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <ellipse cx="56" cy="70" rx="22" ry="12" fill="rgba(184,174,220,0.08)" />
            <path d="M70 62 L76 45 L84 44" />
            <path d="M76 45 L73 33 M76 39 L81 35" />
          </g>
        );
      case 'swan':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M30 72 C42 78, 66 78, 76 68 C78 62, 68 58, 66 50 C64 40, 74 34, 80 40 C83 43, 81 47, 85 48" fill="rgba(184,174,220,0.08)" />
            <path d="M24 78 L92 78" strokeOpacity="0.45" />
          </g>
        );
      case 'cat':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <ellipse cx="62" cy="70" rx="24" ry="14" fill="rgba(184,174,220,0.08)" />
            <circle cx="44" cy="58" r="10" fill="rgba(12,16,32,0.9)" />
            <path d="M36 51 L38 43 L44 48 M52 51 L50 43 L45 48" />
            <path d="M84 72 C94 74, 92 84, 80 84" />
          </g>
        );
      case 'hedgehog':
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M30 74 C30 50, 74 48, 86 70 L88 74 Z" fill="rgba(184,174,220,0.08)" />
            <path d="M36 56 L32 50 M46 50 L44 44 M58 49 L58 43 M70 53 L73 47" />
          </g>
        );
      default:
        // Places (calm landscape motif)
        return (
          <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round">
            <path d="M20 78 Q45 64 70 74 T100 72" />
            <path d="M22 86 L98 86" strokeOpacity="0.4" />
            <circle cx="78" cy="40" r="10" fill="rgba(184,174,220,0.08)" />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 120 120"
      className="w-36 h-36 mx-auto opacity-85"
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
      {renderShape()}
    </svg>
  );
};
