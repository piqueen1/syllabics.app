/*!
 * Copyright (C) 2018 Eddie Antonio Santos <easantos@ualberta.ca>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
  var CreeSROSyllabics = require('cree-sro-syllabics');
  window.CREE_SRO_SYLLABICS_VERSION = CreeSROSyllabics.version.toString();

  var dirty = null;
  document.addEventListener('DOMContentLoaded', function () {
    var sroBox = document.getElementById('sro');
    var sylBox = document.getElementById('syl');
    var doubledVowelCheckbox = document.getElementsByName('double-vowels')[0];
    var macronButtons = document.getElementsByName('macrons');
    var previousSROText = sroBox.value;

    // Convert "dirty" changes soon as the page is loaded.
    if (dirty == 'sro') {
      sendSRO();
    } else if (dirty == 'syl') {
      sendSyllabics();
    }

    // Add a long vowel when double-pressing a vowel.
    sroBox.addEventListener('input', function (event) {
      var newSROText = sroBox.value;
      var differentAt;
      var addedChar;
      var commonPrefix;
      var newString;

      // Obey settings on whether it should change.
      if (!doubledVowelCheckbox.checked) {
        return;
      }

      // Check if exactly one character has been ADDED.
      // Only then can we check whether we want a long vowel.
      if (newSROText.length === previousSROText.length + 1) {
        differentAt = whereDiffer(previousSROText, newSROText);
        console.assert(newSROText.substr(0, differentAt) ===
                       previousSROText.substr(0, differentAt));
        commonPrefix = previousSROText.substr(0, differentAt);
        addedChar = newSROText[differentAt];

        // Check if a vowel has been doubled.
        if (isSROShortVowel(addedChar) && lastCharOf(commonPrefix) === addedChar) {
          // Pretend we never typed the second vowel; instead, add the long
          // vowel to the buffer.
          event.preventDefault();
          // Construct new string by chopping off the short vowel from the
          // common prefix, and chopping off the end of the previous buffer.
          newString = commonPrefix.substr(0, commonPrefix.length - 1)
            + longVowelOf(addedChar)
            + previousSROText.substr(differentAt);
          previousSROText = event.target.value = newString;
          return;
        }
      }

      previousSROText = newSROText;
    });

    function lastCharOf(string) {
      return string[string.length - 1];
    }

    function whereDiffer(prev, current) {
      var i;
      console.assert(prev.length + 1 === current.length);
      for (i = 0; i < prev.length; i++) {
        if (prev[i] !== current[i]) {
          return i;
        }
      }
      // They must differ at the last position!
      return i;
    }


    // Send the appropriate request when the user types or pastes into the SRO
    // or syllabics boxes, respectively.
    sroBox.addEventListener('input', function () {
      sendSRO();
    });
    sylBox.addEventListener('input', function () { sendSyllabics(); });

    // Send a request when somebody hits the macron/circumflex switch.
    for (var i = 0; i < macronButtons.length; i++) {
      var button = macronButtons[i];
      button.addEventListener('input', function() {
        sendSyllabics();
      });
    }

    // Change the values when the /#!hash changes.
    window.onhashchange = function () {
      var settingsBox;
      // Open the settings box if navigated to.
      if (location.hash === '#settings') {
        settingsBox = document.getElementById('settings');
        settingsBox.open = true;
      }

      var pairs = parseFragment();
      updateBoxes(pairs);
      if ('sro' in pairs) {
        sendSRO();
      } else if ('syl' in pairs) {
        sendSyllabics();
      }
    };

    function updateBoxes(data) {
      if (data.sro)
        sroBox.value = data.sro;
      if (data.syl)
        sylBox.value = data.syl;
    }

    function shouldProduceMacrons() {
      var button = document.querySelector('input[name="macrons"]:checked');
      return button.value == 'true';
    }

    function sendSRO() {
      send({ syl: CreeSROSyllabics.sro2syllabics(sroBox.value) });
    }

    function sendSyllabics() {
      var sro = CreeSROSyllabics.syllabics2sro(sylBox.value, {
        longAccents: shouldProduceMacrons() ? 'macrons'  : 'circumflexes'
      });
      send({ sro: sro });
    }

    function send(message) {
      updateBoxes(message);
    }

    function isIgnorableKey(event) {
      // if event.key is missing...?
      // OR if event.key is something like "Space", "Meta", or something like
      // "ArrowRight", instead of a single character.
      return !event.key || event.key.length > 1;
    }

    // Return the long version of a short vowel.
    function longVowelOf(vowel) {
      if (vowel === 'e') {
        return 'ê';
      } else if (vowel === 'i') {
        return 'î';
      } else if (vowel === 'o') {
        return 'ô';
      } else if (vowel === 'a') {
        return 'â'
      } else {
        throw new RangeError('Invalid long vowel: ' + vowel);
      }
    }

    function isSROShortVowel(letter) {
      return letter === 'e' || letter === 'i' || letter === 'o' || letter === 'a';
    }
  });

  window.getDefaultTextareaValue = function (name) {
    var textarea = document.getElementById(name);

    if (name != 'sro' && name != 'syl') {
      return;
    }

    var fragment = parseFragment();
    if (fragment[name]) {
      dirty = name;
      textarea.value = fragment[name];
    }
  };

  function parseFragment() {
    var fragment = location.hash;
    var pairsText = fragment.split('!', 2)[1];
    if (!pairsText) {
      return {};
    }

    var pairs = {};
    pairsText.split(';').forEach(function (pair) {
      var _pair = pair.split(':', 2), key = _pair[0], value = _pair[1];
      pairs[key] = decodeURIComponent(value);
    });

    return pairs;
  }
}());
