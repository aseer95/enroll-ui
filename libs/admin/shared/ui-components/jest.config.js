module.exports = {
  name: 'admin-shared-ui-components',
  preset: '../../../../jest.config.js',
  coverageDirectory: '../../../../coverage/libs/admin/shared/ui-components',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
