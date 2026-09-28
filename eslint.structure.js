/**
 * Luat cau truc thu muc cua src/, ep bang ESLint (loi -> CI do).
 * Day la nguon su that cua muc "Luat phu thuoc" trong docs/ARCHITECTURE.md:
 * sua luat o day thi sua ca tai lieu.
 */

/** Moi tang (thu muc trong src/) chi duoc import chinh no va cac tang liet ke o day. */
const ALLOWED_IMPORTS = {
  app: [
    'features',
    'providers',
    'components/common',
    'components/ui',
    'hooks',
    'constants',
    'types',
    'utils',
  ],
  providers: [
    'features',
    'api',
    'store',
    'lib',
    'components/common',
    'components/ui',
    'hooks',
    'constants',
    'types',
    'utils',
  ],
  features: [
    'api',
    'store',
    'lib',
    'components/common',
    'components/ui',
    'hooks',
    'constants',
    'types',
    'utils',
  ],
  'components/common': ['components/ui', 'hooks', 'constants', 'types', 'utils'],
  'components/ui': ['hooks', 'constants', 'types', 'utils'],
  store: ['api', 'lib', 'constants', 'types', 'utils'],
  hooks: ['store', 'lib', 'constants', 'types', 'utils'],
  api: ['lib', 'constants', 'types', 'utils'],
  lib: ['constants', 'types', 'utils'],
  utils: ['constants', 'types'],
  constants: ['types'],
  types: [],
};

const LAYERS = Object.keys(ALLOWED_IMPORTS);
const TEST_FILES = ['src/__tests__/**', '**/*.test.ts', '**/*.test.tsx'];
const FEATURE_DIR = 'src/features/*';
const DOCS_HINT = 'Xem "Luat phu thuoc" trong docs/ARCHITECTURE.md.';

/** Thu vien chi tang `owner` duoc dung truc tiep; tang khac di qua lop boc cua tang do. */
const OWNED_PACKAGES = [
  {
    name: 'axios',
    owner: 'api',
    message: 'Chi src/api/ dung axios. Goi API qua features/<ten>/api/.',
  },
  {
    name: 'expo-secure-store',
    owner: 'lib',
    message: 'Dung secureStorage trong @/lib/storage.',
  },
  {
    name: '@react-native-async-storage/async-storage',
    owner: 'lib',
    message: 'Dung storage trong @/lib/storage.',
  },
];

const API_CLIENT_BAN = {
  name: '@/api/client',
  message: 'Chi features/<ten>/api/ goi apiClient. Hook va component goi qua tang api cua feature.',
};

function banPackages(names, message) {
  return names.map((name) => ({ name, message }));
}

/** Import bi cam them cho tung tang, ngoai luat phu thuoc chung. */
const EXTRA_BANNED = {
  app: banPackages(
    ['react-hook-form', '@hookform/resolvers/zod', 'zod', '@tanstack/react-query', 'zustand'],
    'Route chi lap ghep va dieu huong. Form, goi API, state dat trong src/features/<ten>/.',
  ),
  providers: [API_CLIENT_BAN],
  'components/common': banPackages(
    ['@tanstack/react-query', 'zustand'],
    'Component dung chung chi nhan props va phat su kien, khong tu lay du lieu.',
  ),
  'components/ui': banPackages(
    ['@tanstack/react-query', 'zustand'],
    'Component dung chung chi nhan props va phat su kien, khong tu lay du lieu.',
  ),
  utils: banPackages(
    ['react', 'react-native', 'expo-router', '@tanstack/react-query', 'zustand'],
    'utils/ chi chua ham thuan tuy, khong phu thuoc React, Expo hay thu vien state.',
  ),
};

const FEATURE_ALIAS_BAN = {
  group: ['@/features', '@/features/**'],
  message: 'Trong feature dung duong dan tuong doi. Khong import feature khac.',
};

const FEATURE_DEEP_IMPORT_BAN = {
  group: ['@/features/*/*'],
  message: 'Chi import feature qua cong public @/features/<ten> (file index.ts).',
};

/**
 * Tao cau hinh `no-restricted-imports` cho mot nhom file.
 * `maxParentDepth` la so cap `../` toi da: 0 o moi tang (dung alias @/),
 * 1 trong thu muc con cua feature (vd `../schemas`) de khong the ra khoi feature.
 */
function restrictImports({ files, layer, maxParentDepth = 0, extraPaths = [] }) {
  const allowedLayers = ALLOWED_IMPORTS[layer];
  const forbiddenLayers = LAYERS.filter(
    (other) => other !== layer && !allowedLayers.includes(other),
  );

  const patterns = [
    {
      regex: `^(\\.\\./){${maxParentDepth + 1}}`,
      message:
        maxParentDepth === 0
          ? 'Dung alias @/ thay cho duong dan ../'
          : 'Import tuong doi khong duoc ra khoi thu muc feature.',
    },
  ];

  if (forbiddenLayers.length > 0) {
    patterns.push({
      group: forbiddenLayers.flatMap((other) => [`@/${other}`, `@/${other}/**`]),
      message: `Tang "${layer}" chi duoc import: ${allowedLayers.join(', ') || 'khong tang nao'}. ${DOCS_HINT}`,
    });
  }

  if (layer === 'features') patterns.push(FEATURE_ALIAS_BAN);
  else if (allowedLayers.includes('features')) patterns.push(FEATURE_DEEP_IMPORT_BAN);

  const paths = [
    ...OWNED_PACKAGES.filter((pkg) => pkg.owner !== layer).map(({ name, message }) => ({
      name,
      message,
    })),
    ...(EXTRA_BANNED[layer] ?? []),
    ...extraPaths,
  ];

  return {
    files,
    ignores: TEST_FILES,
    rules: { 'no-restricted-imports': ['error', { paths, patterns }] },
  };
}

/**
 * Cau truc co dinh cua mot feature: file goc (constants.ts, utils.ts la tuy chon)
 * va ba thu muc phang api/, components/, hooks/.
 */
const FEATURE_ROOT_FILES = `${FEATURE_DIR}/{index,schemas,types,constants,utils}.ts`;
const FEATURE_API_FILES = `${FEATURE_DIR}/api/*.{ts,tsx}`;
const FEATURE_UI_FILES = `${FEATURE_DIR}/{components,hooks}/*.{ts,tsx}`;

const featureConfigs = [
  restrictImports({
    files: [`${FEATURE_DIR}/*.{ts,tsx}`],
    layer: 'features',
    extraPaths: [API_CLIENT_BAN],
  }),
  restrictImports({ files: [FEATURE_API_FILES], layer: 'features', maxParentDepth: 1 }),
  restrictImports({
    files: [FEATURE_UI_FILES],
    layer: 'features',
    maxParentDepth: 1,
    extraPaths: [API_CLIENT_BAN],
  }),
];

const layerConfigs = LAYERS.filter((layer) => layer !== 'features').map((layer) =>
  restrictImports({ files: [`src/${layer}/**`], layer }),
);

/** File nam ngoai cac vi tri tren la sai cau truc. */
const unknownLocationConfig = {
  files: ['src/**'],
  ignores: [
    ...LAYERS.filter((layer) => layer !== 'features').map((layer) => `src/${layer}/**`),
    FEATURE_ROOT_FILES,
    FEATURE_API_FILES,
    FEATURE_UI_FILES,
    ...TEST_FILES,
  ],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Program',
        message:
          'File nam ngoai cau truc thu muc cho phep. Dat vao dung tang, hoac cap nhat eslint.structure.js va docs/ARCHITECTURE.md.',
      },
    ],
  },
};

/** Chi file route (expo-router) duoc export default. */
const namedExportConfig = {
  files: ['src/**'],
  ignores: ['src/app/**', ...TEST_FILES],
  rules: { 'import/no-default-export': 'error' },
};

module.exports = [...layerConfigs, ...featureConfigs, unknownLocationConfig, namedExportConfig];
