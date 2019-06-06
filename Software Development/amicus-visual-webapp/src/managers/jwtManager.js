var jwt = require('jwt-simple');
var secret = 'kbXmws5yebisyIv_2XroEfWUyBL5e__k53w7KxOzmmXZCSrTxGqwsZJUocC3gFygAZsueFWGiotSVziOSZiFL02_QRAfxDQ81mMEtwe7h9-509jkKA3lGZDVEQiZIV4K0INa_XJKf1FMA9Nb1XdGCUtYp0LCpxTVAfwDb6MeI5qKJKAiIc9rNZEk-g9QxEdd-RZBK1rRz_YnUB555Gn8ZyE8k150XMA21wUdIPmwdAPjy1yan71pXMBzZEGXDWt3LsmJ0ndxfm6BdpgDpq_7YAbdjwUtGokRjX_1C7sTufrLETR4IgX2RNuBkNCKLl4RbwKwyyvc_SWmU42Uluzciw';

export function amicusDecode(token) {
  var decoded = jwt.decode(token, secret);
  return decoded;
}
