import { applyApiSecurity } from './_security.js';
import { APP_VERSION } from '../src/utils/release.js';
import {
  MOBILE_API_CONTRACT_VERSION,
  MOBILE_PLAY_DATA_CONTRACT_VERSION,
  MOBILE_SUPPORTED_GAMES,
} from '../src/utils/mobileContract.js';

export default async function handler(req, res) {
  applyApiSecurity(res);
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }
  return res.status(200).json({
    success: true,
    service: 'primy-mobile',
    apiContract: MOBILE_API_CONTRACT_VERSION,
    webRelease: APP_VERSION,
    playDataContract: MOBILE_PLAY_DATA_CONTRACT_VERSION,
    supportedGames: MOBILE_SUPPORTED_GAMES,
    features: {
      exactEventVerification: true,
      backgroundVerification: true,
      accountDeletion: true,
      androidSignup: true,
      webSignup: false,
      sportsOfficialRounds: true,
      horseOfficialRounds: true,
    },
  });
}
