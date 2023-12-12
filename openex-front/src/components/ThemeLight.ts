import LogoText from '../static/images/logo_text.png';
import LogoCollapsed from '../static/images/logo.png';
import { fileUri } from '../utils/Environment';
import { hexToRGB } from '../utils/Colors';
import type { ExtendedThemeOptions } from './Theme';

const EE_COLOR = '#0066ff';

const ThemeLight = (
  logo: string | null,
  logo_collapsed: string | null,
  background: string | null,
  paper: string | null,
  nav: string | null,
  primary: string | null,
  secondary: string | null,
  accent: string | null,
): ExtendedThemeOptions => ({
  logo: logo || fileUri(LogoText),
  logo_collapsed: logo_collapsed || fileUri(LogoCollapsed),
  borderRadius: 2,
  palette: {
    mode: 'light',
    common: { white: '#ffffff' },
    error: {
      main: '#f44336',
      dark: '#c62828',
    },
    success: { main: '#03A847' },
    primary: { main: primary || '#0066ff' },
    secondary: { main: secondary || '#d81b60' },
    chip: { main: '#000000' },
    ee: {
      main: EE_COLOR,
      background: hexToRGB(EE_COLOR, 0.2),
      lightBackground: hexToRGB(EE_COLOR, 0.08),
      contrastText: '#ffffff',
    },
    background: {
      default: background || '#f3f6f9',
      paper: paper || '#ffffff',
      nav: nav || '#ffffff',
      accent: accent || '#d3eaff',
      shadow: 'rgba(0, 0, 0, .05)',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", sans-serif',
    body2: {
      fontSize: '0.8rem',
    },
    body1: {
      fontSize: '0.9rem',
    },
    overline: {
      fontWeight: 500,
    },
    h1: {
      margin: '0 0 10px 0',
      padding: 0,
      color: primary || '#007fff',
      fontWeight: 400,
      fontSize: 22,
    },
    h2: {
      margin: '0 0 10px 0',
      padding: 0,
      fontWeight: 500,
      fontSize: 16,
      textTransform: 'uppercase',
    },
    h3: {
      margin: '0 0 10px 0',
      padding: 0,
      color: primary || '#007fff',
      fontWeight: 400,
      fontSize: 13,
    },
    h4: {
      margin: '0 0 10px 0',
      padding: 0,
      textTransform: 'uppercase',
      fontSize: 12,
      fontWeight: 500,
      color: '#505050',
    },
    h5: {
      fontWeight: 400,
      fontSize: 13,
      textTransform: 'uppercase',
      marginTop: -4,
    },
    h6: {
      fontWeight: 400,
      fontSize: 18,
      color: primary || '#007fff',
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
        },
        arrow: {
          color: 'rgba(0,0,0,0.7)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#6b6b6b #2b2b2b',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: paper || '#f3f6f9',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: accent || '#d3eaff',
            minHeight: 24,
            border: `3px solid ${paper || '#f3f6f9'}`,
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus':
            {
              backgroundColor: accent || '#d3eaff',
            },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active':
            {
              backgroundColor: accent || '#d3eaff',
            },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover':
            {
              backgroundColor: accent || '#d3eaff',
            },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: accent || '#d3eaff',
          },
          html: {
            WebkitFontSmoothing: 'auto',
          },
          a: {
            color: primary || '#007fff',
          },
          'input:-webkit-autofill': {
            WebkitAnimation: 'autofill 0s forwards',
            animation: 'autofill 0s forwards',
            WebkitTextFillColor: '#000000 !important',
            caretColor: 'transparent !important',
            WebkitBoxShadow:
              '0 0 0 1000px rgba(4, 8, 17, 0.88) inset !important',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          },
          pre: {
            background: `${accent || '#c0dfff'} !important`,
            color: '#000000 !important',
          },
          code: {
            fontFamily: 'Consolas, monaco, monospace',
            background: `${accent || '#c0dfff'} !important`,
            color: '#000000 !important',
            padding: 3,
            fontSize: 12,
            fontWeight: 400,
          },
          '.w-md-editor': {
            boxShadow: 'none',
            background: 'transparent',
            borderBottom: '1px solid rgba(0, 0, 0, 0.87) !important',
            transition: 'borderBottom .3s',
            '&:hover': {
              borderBottom: '2px solid #000000 !important',
            },
            '&:focus-within': {
              borderBottom: `2px solid #${primary || '007fff'} !important`,
            },
          },
          '.error .w-md-editor': {
            border: '0 !important',
            borderBottom: '2px solid #f44336 !important',
            '&:hover': {
              border: '0 !important',
              borderBottom: '2px solid #f44336 !important',
            },
            '&:focus': {
              border: '0 !important',
              borderBottom: '2px solid #f44336 !important',
            },
          },
          '.w-md-editor-toolbar': {
            border: '0 !important',
            backgroundColor: 'transparent !important',
            color: '#000000 !important',
          },
          '.w-md-editor-toolbar li button': {
            color: '#000000 !important',
          },
          '.w-md-editor-text textarea': {
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: 13,
            color: '#000000',
          },
          '.w-md-editor-preview': {
            boxShadow: 'inset 1px 0 0 0 rgba(0, 0, 0, 0.2)',
          },
          '.wmde-markdown': {
            background: 'transparent',
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: 13,
            color: '#000000',
          },
          '.wmde-markdown tr': {
            background: 'transparent !important',
          },
          '.react-mde': {
            border: '0 !important',
          },
          '.error .react-mde textarea': {
            border: '0 !important',
            borderBottom: '2px solid #f44336 !important',
            '&:hover': {
              border: '0 !important',
              borderBottom: '2px solid #f44336 !important',
            },
            '&:focus': {
              border: '0 !important',
              borderBottom: '2px solid #f44336 !important',
            },
          },
          '.mde-header': {
            border: '0 !important',
            backgroundColor: 'transparent !important',
            color: '#000000 !important',
          },
          '.mde-header-item button': {
            color: '#000000 !important',
          },
          '.mde-tabs button': {
            color: '#000000 !important',
          },
          '.mde-textarea-wrapper textarea': {
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontSize: 13,
            color: 'rgba(0, 0, 0, 0.87)',
            background: 'transparent',
            borderBottom: '1px solid rgba(0, 0, 0, 0.87) !important',
            transition: 'borderBottom .3s',
            '&:hover': {
              borderBottom: '2px solid #000000 !important',
            },
            '&:focus': {
              borderBottom: `2px solid #${primary || '#007fff'} !important`,
            },
          },
          '.react-grid-placeholder': {
            backgroundColor: `${accent || '#c0dfff'} !important`,
          },
          '.react_time_range__track': {
            backgroundColor: 'rgba(1, 226, 255, 0.1) !important',
            borderLeft: '1px solid #00bcd4 !important',
            borderRight: '1px solid #00bcd4 !important',
          },
          '.react_time_range__handle_marker': {
            backgroundColor: '#00bcd4 !important',
          },
          '.leaflet-container': {
            backgroundColor: `${paper || '#f3f6f9'} !important`,
          },
          '.react-grid-item .react-resizable-handle::after': {
            borderRight: '2px solid rgba(0, 0, 0, 0.6) !important',
            borderBottom: '2px solid rgba(0, 0, 0, 0.6) !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        },
        body: {
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        },
      },
    },
  },
});

export default ThemeLight;
