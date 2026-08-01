import React from 'react';
import { APP_RELEASE_LABEL } from '../utils/release.js';

export default function ReleaseStamp({ className = '' }) {
  return <small className={`primy-release-stamp ${className}`}>Primy · {APP_RELEASE_LABEL}</small>;
}
