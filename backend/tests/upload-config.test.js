const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FILE_UPLOAD_RULES,
  createFileFilter,
  getAllowedExtensions,
  validateUploadedFile,
} = require('../utils/uploadConfig');

test('document and module upload rules stay aligned for shared formats', () => {
  const docTypes = new Set(FILE_UPLOAD_RULES.documents.allowedMimeTypes);
  const moduleTypes = new Set(FILE_UPLOAD_RULES.modules.allowedMimeTypes);

  for (const mimeType of docTypes) {
    assert.equal(moduleTypes.has(mimeType), true, `${mimeType} should be allowed for modules too`);
  }

  assert.deepEqual(getAllowedExtensions('documents'), FILE_UPLOAD_RULES.documents.allowedExtensions);
});

test('centralized file filter rejects unsupported mime types', async () => {
  const filter = createFileFilter('documents');

  await assert.rejects(
    async () => new Promise((resolve, reject) => {
      filter({}, { mimetype: 'application/xml', originalname: 'payload.xml' }, (err, accepted) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(accepted);
      });
    }),
    /Unsupported file type/i,
  );
});

test('post-upload validator rejects mismatched file signatures', async () => {
  const middleware = validateUploadedFile('modules');

  await assert.rejects(
    async () => new Promise((resolve, reject) => {
      middleware(
        {
          file: {
            originalname: 'fake.pdf',
            buffer: Buffer.from('not a pdf'),
          },
        },
        {},
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        },
      );
    }),
    /content does not match/i,
  );
});
