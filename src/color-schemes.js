export const COLOR_SCHEME_FILE_TYPE = 'autumn-desk-color-schemes';
export const COLOR_SCHEME_FILE_VERSION = '1.0';

const lightPaletteSeed = {
  canvas: '#f5f5f7', surface: '#ffffff', surfaceRaised: '#ffffff', surfaceSubtle: '#f2f2f7', surfaceHover: '#e8e8ed',
  ink: '#1d1d1f', muted: '#6e6e73', mutedStrong: '#515154', mutedSoft: '#86868b', line: '#d2d2d7', lineSubtle: '#e5e5ea',
  blue: '#007aff', blueHover: '#0066cc', blueSoft: '#eaf3ff', navy: '#1d1d1f', focusRing: '#007aff38', overlay: '#0000004d',
  statusAssessmentFg: '#007780', statusAssessmentSoft: '#e5f8f8', statusAssessmentFill: '#149ca3',
  statusSubmittedFg: '#6e6e73', statusSubmittedSoft: '#f2f2f7', statusSubmittedFill: '#8e8e93', statusWrittenTestFg: '#5856d6', statusWrittenTestSoft: '#f0efff', statusWrittenTestFill: '#5856d6',
  statusFirstInterviewFg: '#b76b00', statusFirstInterviewSoft: '#fff5df', statusFirstInterviewFill: '#f0a20a', statusSecondInterviewFg: '#c85c00', statusSecondInterviewSoft: '#fff0e5', statusSecondInterviewFill: '#ff7a00',
  statusThirdInterviewFg: '#d65356', statusThirdInterviewSoft: '#fff0f0', statusThirdInterviewFill: '#ff6961', statusHrInterviewFg: '#af52de', statusHrInterviewSoft: '#fbefff', statusHrInterviewFill: '#af52de',
  statusOfferFg: '#23834b', statusOfferSoft: '#eaf8ef', statusOfferFill: '#34c759', statusRejectedFg: '#d92d20', statusRejectedSoft: '#fff0ef', statusRejectedFill: '#ff3b30',
  priorityLowFg: '#0f766e', priorityLowSoft: '#e8f7f4', priorityLowFill: '#159a8c', priorityMediumFg: '#9a6700', priorityMediumSoft: '#fff6df', priorityMediumFill: '#d89614', priorityHighFg: '#b4235c', priorityHighSoft: '#fff0f6', priorityHighFill: '#d13b78'
};

const darkPaletteSeed = {
  canvas: '#000000', surface: '#1c1c1e', surfaceRaised: '#2c2c2e', surfaceSubtle: '#151517', surfaceHover: '#38383a',
  ink: '#f5f5f7', muted: '#aeaeb2', mutedStrong: '#d1d1d6', mutedSoft: '#8e8e93', line: '#38383a', lineSubtle: '#2c2c2e',
  blue: '#0a84ff', blueHover: '#409cff', blueSoft: '#0a84ff24', navy: '#f5f5f7', focusRing: '#0a84ff57', overlay: '#0000008c',
  statusAssessmentFg: '#70dfe4', statusAssessmentSoft: '#163e44', statusAssessmentFill: '#49bbc2',
  statusSubmittedFg: '#aeaeb2', statusSubmittedSoft: '#2c2c2e', statusSubmittedFill: '#8e8e93', statusWrittenTestFg: '#a8a6ff', statusWrittenTestSoft: '#37365d', statusWrittenTestFill: '#8b8aff',
  statusFirstInterviewFg: '#ffd16a', statusFirstInterviewSoft: '#4a3917', statusFirstInterviewFill: '#ffb340', statusSecondInterviewFg: '#ffb17a', statusSecondInterviewSoft: '#4b301f', statusSecondInterviewFill: '#ff8b4b',
  statusThirdInterviewFg: '#ff9a9a', statusThirdInterviewSoft: '#4a282d', statusThirdInterviewFill: '#ff7a7a', statusHrInterviewFg: '#f0a7de', statusHrInterviewSoft: '#48263f', statusHrInterviewFill: '#e889cd',
  statusOfferFg: '#72dc9a', statusOfferSoft: '#1d422f', statusOfferFill: '#5ad27f', statusRejectedFg: '#ff9c97', statusRejectedSoft: '#48262a', statusRejectedFill: '#ff6961',
  priorityLowFg: '#72ddd0', priorityLowSoft: '#173d3a', priorityLowFill: '#43bdb0', priorityMediumFg: '#f4cd78', priorityMediumSoft: '#473817', priorityMediumFill: '#dca83d', priorityHighFg: '#ff9ac5', priorityHighSoft: '#4a2036', priorityHighFill: '#eb6198'
};

const lightBase = { ...lightPaletteSeed };
const darkBase = { ...darkPaletteSeed };

function scheme(id, label, light = {}, dark = {}) {
  return { id, label, light: { ...lightBase, ...light }, dark: { ...darkBase, ...dark } };
}

export const BUILT_IN_COLOR_SCHEMES = [
  scheme('apple', '苹果蓝', {
    canvas: '#f7f9fc', surfaceSubtle: '#f0f4fa', surfaceHover: '#e5edf8', ink: '#14213d', muted: '#64748b', mutedStrong: '#43536a', mutedSoft: '#8a99ad', line: '#d7e0ec', lineSubtle: '#e8eef5', blue: '#0a6ee8', blueHover: '#075bc4', blueSoft: '#e8f2ff', navy: '#102a43', focusRing: '#0a6ee838', overlay: '#102a4352', statusAssessmentFg: '#0e7490', statusAssessmentSoft: '#e6f6fb', statusAssessmentFill: '#1593b3',
    statusSubmittedFg: '#5b6b7d', statusSubmittedSoft: '#eef2f6', statusSubmittedFill: '#8090a3', statusWrittenTestFg: '#6847be', statusWrittenTestSoft: '#f1edff', statusWrittenTestFill: '#7c5bd1', statusFirstInterviewFg: '#9a5a00', statusFirstInterviewSoft: '#fff5df', statusFirstInterviewFill: '#d99513', statusSecondInterviewFg: '#b94d08', statusSecondInterviewSoft: '#fff0e6', statusSecondInterviewFill: '#e66f17', statusThirdInterviewFg: '#b83c5b', statusThirdInterviewSoft: '#fff0f3', statusThirdInterviewFill: '#d75c78', statusHrInterviewFg: '#aa357e', statusHrInterviewSoft: '#fceef8', statusHrInterviewFill: '#c85b9d', statusOfferFg: '#167445', statusOfferSoft: '#e9f8ef', statusOfferFill: '#2fa866', statusRejectedFg: '#bd3b35', statusRejectedSoft: '#fff0ef', statusRejectedFill: '#dd625a',
    priorityLowFg: '#0f766e', priorityLowSoft: '#e8f7f4', priorityLowFill: '#159a8c', priorityMediumFg: '#9a6700', priorityMediumSoft: '#fff6df', priorityMediumFill: '#d89614', priorityHighFg: '#b4235c', priorityHighSoft: '#fff0f6', priorityHighFill: '#d13b78'
  }, {
    canvas: '#0d1624', surface: '#142033', surfaceRaised: '#1c2b40', surfaceSubtle: '#101b2b', surfaceHover: '#263852', ink: '#edf5ff', muted: '#aabbd0', mutedStrong: '#d5e2f1', mutedSoft: '#8295ae', line: '#2a3d56', lineSubtle: '#1e3047', blue: '#63a8ff', blueHover: '#94c4ff', blueSoft: '#63a8ff26', navy: '#e9f3ff', focusRing: '#63a8ff59', overlay: '#00000094', statusAssessmentFg: '#7bd8e8', statusAssessmentSoft: '#173d4b', statusAssessmentFill: '#45b8cf',
    statusSubmittedFg: '#b6c6d8', statusSubmittedSoft: '#26364b', statusSubmittedFill: '#8fa4bd', statusWrittenTestFg: '#c4b2ff', statusWrittenTestSoft: '#39315c', statusWrittenTestFill: '#a58cf2', statusFirstInterviewFg: '#f3c96e', statusFirstInterviewSoft: '#49391d', statusFirstInterviewFill: '#e2ae47', statusSecondInterviewFg: '#ffb488', statusSecondInterviewSoft: '#4a2e21', statusSecondInterviewFill: '#ee8a4b', statusThirdInterviewFg: '#ffafbf', statusThirdInterviewSoft: '#4c2835', statusThirdInterviewFill: '#e9829a', statusHrInterviewFg: '#f4a8da', statusHrInterviewSoft: '#4a2942', statusHrInterviewFill: '#df7fc1', statusOfferFg: '#7de0a5', statusOfferSoft: '#1c4331', statusOfferFill: '#57c982', statusRejectedFg: '#ffaaa4', statusRejectedSoft: '#4c292a', statusRejectedFill: '#ec7771',
    priorityLowFg: '#75dfd3', priorityLowSoft: '#173f3b', priorityLowFill: '#45bbae', priorityMediumFg: '#f4ce79', priorityMediumSoft: '#483817', priorityMediumFill: '#d9a53c', priorityHighFg: '#ffa7ca', priorityHighSoft: '#4b2037', priorityHighFill: '#e7669a'
  }),
  scheme('indigo', '夜幕紫', {
    canvas: '#faf8ff', surfaceSubtle: '#f3effa', surfaceHover: '#ebe5f7', ink: '#2c1d4e', muted: '#756b8b', mutedStrong: '#55496b', mutedSoft: '#968aa9', line: '#ddd5eb', lineSubtle: '#eee9f5', blue: '#6d4aff', blueHover: '#5633db', blueSoft: '#f0edff', navy: '#392268', focusRing: '#6d4aff38', overlay: '#2a164c52', statusAssessmentFg: '#2869aa', statusAssessmentSoft: '#eaf4fc', statusAssessmentFill: '#4d8ac8',
    statusSubmittedFg: '#746d84', statusSubmittedSoft: '#f1eff5', statusSubmittedFill: '#948ca2', statusWrittenTestFg: '#6b42c7', statusWrittenTestSoft: '#f0eaff', statusWrittenTestFill: '#8157db', statusFirstInterviewFg: '#9b6200', statusFirstInterviewSoft: '#fff4dc', statusFirstInterviewFill: '#d99a23', statusSecondInterviewFg: '#ba5813', statusSecondInterviewSoft: '#fff0e7', statusSecondInterviewFill: '#df7b38', statusThirdInterviewFg: '#b54267', statusThirdInterviewSoft: '#fff0f4', statusThirdInterviewFill: '#d46686', statusHrInterviewFg: '#a9349a', statusHrInterviewSoft: '#fceefa', statusHrInterviewFill: '#c25cb3', statusOfferFg: '#197558', statusOfferSoft: '#e9f8f1', statusOfferFill: '#37a77b', statusRejectedFg: '#b43e4c', statusRejectedSoft: '#fff0f2', statusRejectedFill: '#d96270',
    priorityLowFg: '#167d72', priorityLowSoft: '#e8f8f5', priorityLowFill: '#239c8e', priorityMediumFg: '#8e5900', priorityMediumSoft: '#fff5df', priorityMediumFill: '#ca8b16', priorityHighFg: '#a82e68', priorityHighSoft: '#fff0f7', priorityHighFill: '#c94680'
  }, {
    canvas: '#171126', surface: '#221a35', surfaceRaised: '#302546', surfaceSubtle: '#1b1430', surfaceHover: '#3d3155', ink: '#f6f0ff', muted: '#c1b4d3', mutedStrong: '#e4daf1', mutedSoft: '#9a8cac', line: '#423458', lineSubtle: '#302441', blue: '#aa91ff', blueHover: '#c5b3ff', blueSoft: '#aa91ff26', navy: '#f2ebff', focusRing: '#aa91ff59', overlay: '#00000096', statusAssessmentFg: '#84c3f2', statusAssessmentSoft: '#1b3b55', statusAssessmentFill: '#5e9dcc',
    statusSubmittedFg: '#c4b9d1', statusSubmittedSoft: '#342b45', statusSubmittedFill: '#a195b0', statusWrittenTestFg: '#cfbfff', statusWrittenTestSoft: '#443566', statusWrittenTestFill: '#ae94f0', statusFirstInterviewFg: '#f2cb7d', statusFirstInterviewSoft: '#4a391d', statusFirstInterviewFill: '#dfa94a', statusSecondInterviewFg: '#f6b18b', statusSecondInterviewSoft: '#4b2e25', statusSecondInterviewFill: '#e99362', statusThirdInterviewFg: '#f3a9bd', statusThirdInterviewSoft: '#4c2938', statusThirdInterviewFill: '#df7e9b', statusHrInterviewFg: '#efa9e4', statusHrInterviewSoft: '#4d2948', statusHrInterviewFill: '#d97fc9', statusOfferFg: '#82ddba', statusOfferSoft: '#1e4337', statusOfferFill: '#59bd95', statusRejectedFg: '#f5a8af', statusRejectedSoft: '#4d2930', statusRejectedFill: '#df7783',
    priorityLowFg: '#7de0d2', priorityLowSoft: '#173e3a', priorityLowFill: '#44bbac', priorityMediumFg: '#f0c56c', priorityMediumSoft: '#493718', priorityMediumFill: '#d5a13c', priorityHighFg: '#ffaad1', priorityHighSoft: '#4b2039', priorityHighFill: '#e7659f'
  }),
  scheme('jade', '森林绿', {
    canvas: '#f4faf7', surfaceSubtle: '#eaf5ef', surfaceHover: '#dfeee6', ink: '#153b32', muted: '#617c73', mutedStrong: '#426157', mutedSoft: '#849c93', line: '#cfe2d9', lineSubtle: '#e3eee8', blue: '#087c62', blueHover: '#05664f', blueSoft: '#e3f6ef', navy: '#123f34', focusRing: '#087c6238', overlay: '#0e392e52', statusAssessmentFg: '#5046b8', statusAssessmentSoft: '#eeefff', statusAssessmentFill: '#6c63c9',
    statusSubmittedFg: '#58736a', statusSubmittedSoft: '#edf5f1', statusSubmittedFill: '#7f9a90', statusWrittenTestFg: '#674dba', statusWrittenTestSoft: '#f1eeff', statusWrittenTestFill: '#8067d0', statusFirstInterviewFg: '#986300', statusFirstInterviewSoft: '#fff5df', statusFirstInterviewFill: '#d69a24', statusSecondInterviewFg: '#ad5b13', statusSecondInterviewSoft: '#fff1e7', statusSecondInterviewFill: '#d77d3c', statusThirdInterviewFg: '#af4653', statusThirdInterviewSoft: '#fff0f1', statusThirdInterviewFill: '#d46c74', statusHrInterviewFg: '#9d3d7e', statusHrInterviewSoft: '#fceff8', statusHrInterviewFill: '#bd659c', statusOfferFg: '#167457', statusOfferSoft: '#e4f7ef', statusOfferFill: '#32a67b', statusRejectedFg: '#b53e46', statusRejectedSoft: '#fff0f0', statusRejectedFill: '#d66269',
    priorityLowFg: '#176f8c', priorityLowSoft: '#e7f5f9', priorityLowFill: '#2a91ad', priorityMediumFg: '#926100', priorityMediumSoft: '#fff5de', priorityMediumFill: '#cd911c', priorityHighFg: '#a63b6c', priorityHighSoft: '#fff0f6', priorityHighFill: '#c85385'
  }, {
    canvas: '#0d1d19', surface: '#162a24', surfaceRaised: '#203a32', surfaceSubtle: '#10241e', surfaceHover: '#2b493f', ink: '#edf9f3', muted: '#aec4ba', mutedStrong: '#d4e8de', mutedSoft: '#839d92', line: '#2c4a40', lineSubtle: '#20382f', blue: '#4ed0a8', blueHover: '#7be2c2', blueSoft: '#4ed0a826', navy: '#e8f8f0', focusRing: '#4ed0a859', overlay: '#00000090', statusAssessmentFg: '#b6a8ff', statusAssessmentSoft: '#39345d', statusAssessmentFill: '#9185dc',
    statusSubmittedFg: '#b5cdc2', statusSubmittedSoft: '#294139', statusSubmittedFill: '#88a79b', statusWrittenTestFg: '#c0b4ff', statusWrittenTestSoft: '#3d365e', statusWrittenTestFill: '#a08ee4', statusFirstInterviewFg: '#efca78', statusFirstInterviewSoft: '#4b3b20', statusFirstInterviewFill: '#dca84a', statusSecondInterviewFg: '#edb38b', statusSecondInterviewSoft: '#4b3226', statusSecondInterviewFill: '#df9161', statusThirdInterviewFg: '#efa5aa', statusThirdInterviewSoft: '#4c2b30', statusThirdInterviewFill: '#db7d83', statusHrInterviewFg: '#eca7d6', statusHrInterviewSoft: '#4b2a43', statusHrInterviewFill: '#d27eb4', statusOfferFg: '#7be0ba', statusOfferSoft: '#1c4336', statusOfferFill: '#50be91', statusRejectedFg: '#f1a6aa', statusRejectedSoft: '#4c2a2c', statusRejectedFill: '#dc777b',
    priorityLowFg: '#77c9eb', priorityLowSoft: '#183b48', priorityLowFill: '#48a8cc', priorityMediumFg: '#edc66f', priorityMediumSoft: '#4a3a1a', priorityMediumFill: '#d6a13b', priorityHighFg: '#f7a9cd', priorityHighSoft: '#4c2038', priorityHighFill: '#dd6698'
  })
];

const tokenNames = Object.keys(lightBase);
const idPattern = /^[a-z][a-z0-9-]{1,31}$/;
const colorPattern = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

function normalize(raw) {
  if (!raw || typeof raw !== 'object' || !idPattern.test(raw.id) || typeof raw.label !== 'string' || !raw.label.trim()) throw new Error('配色方案格式无效');
  const read = (appearance, base) => {
    const input = raw[appearance] || {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('配色缺少亮色或深色配置');
    Object.entries(input).forEach(([key, value]) => {
      if (!tokenNames.includes(key)) throw new Error(`配色 token 无效：${key}`);
      if (!colorPattern.test(value)) throw new Error(`配色值无效：${key}`);
    });
    const overrides = Object.fromEntries(Object.entries(input));
    return { ...base, ...overrides };
  };
  return { id: raw.id, label: raw.label.trim().slice(0, 24), light: read('light', lightBase), dark: read('dark', darkBase) };
}

export function mergeColorSchemes(overrides = []) {
  const merged = new Map(BUILT_IN_COLOR_SCHEMES.map(item => [item.id, item]));
  overrides.forEach(item => { const value = normalize(item); merged.set(value.id, value); });
  return [...merged.values()];
}

export function parseColorSchemeFile(raw) {
  if (!raw || raw.type !== COLOR_SCHEME_FILE_TYPE || raw.version !== COLOR_SCHEME_FILE_VERSION || !Array.isArray(raw.schemes)) throw new Error('不是可识别的秋招助手配色文件');
  if (raw.schemes.length > 20) throw new Error('一次最多导入 20 套配色');
  return raw.schemes.map(normalize);
}

export function colorSchemeFile(schemes) {
  return { type: COLOR_SCHEME_FILE_TYPE, version: COLOR_SCHEME_FILE_VERSION, exportedAt: new Date().toISOString(), schemes: schemes.map(normalize) };
}

export function applyColorScheme(root, activeScheme, appearance) {
  const scheme = normalize(activeScheme);
  const palette = appearance === 'dark' ? scheme.dark : scheme.light;
  tokenNames.forEach(key => root.style.setProperty(`--${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}`, palette[key]));
}
