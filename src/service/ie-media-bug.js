/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {dev} from '../log';
import {timer} from '../timer';
import {platformFor} from '../platform';


const TAG = 'ie-media-bug';


/**
 * An ugly fix for IE's problem with `matchMedia` API, where media queries
 * are evaluated incorrectly. See #2577 for more details. Returns the promise
 * that will be resolved when the bug is fixed.
 * @param {!Window} win
 * @param {!../platform.Platform=} opt_platform
 * @return {?Promise}
 * @package
 */
export function checkAndFix(win, opt_platform) {
  const platform = opt_platform || platformFor(win);
  if (!platform.isIe() || matchMediaIeQuite(win)) {
    return null;
  }

  // Poll until the expression resolves correctly, but only up to a point.
  return new Promise(resolve => {
    const endTime = timer.now() + 2000;
    const interval = win.setInterval(() => {
      const now = timer.now();
      const matches = matchMediaIeQuite(win);
      if (matches || now > endTime) {
        win.clearInterval(interval);
        resolve();
        if (!matches) {
          dev.error(TAG, 'IE media never resolved');
        }
      }
    }, 10);
  });
}

/**
 * @param {!Window} win
 * @return {boolean}
 * @private
 */
function matchMediaIeQuite(win) {
  const q = `(min-width: ${win./*OK*/innerWidth}px)` +
      ` AND (max-width: ${win./*OK*/innerWidth}px)`;
  try {
    return win.matchMedia(q).matches;
  } catch (e) {
    dev.error(TAG, 'IE matchMedia failed: ', e);
    // Return `true` to avoid polling on a broken API.
    return true;
  }
}
