const { ObjectId } = require('mongodb');

/**
 * Converte string de 24 caracteres hexadecimais para ObjectId.
 * Mantém ObjectId intacto. Retorna o valor original se não for string válida.
 * @param {string|import('mongodb').ObjectId|null|undefined} id
 * @returns {import('mongodb').ObjectId|*}
 */
function toObjectId(id) {
  if (id == null) return id;
  if (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)) return new ObjectId(id);
  return id;
}

module.exports = { toObjectId };
