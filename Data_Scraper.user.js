// ==UserScript==
// @name         Data_Scraper
// @namespace    https://github.com/nguyend1en/WebTextScraper
// @version      1.0.0
// @description  A sophisticated hybrid scraper for site that has free and vip content. Bypasses paywalls and extracts hidden JSON content.
// @author       nguyend1en
// @match        example: https://*.com/harry-potter/*/read/*.html*
// @grant        none
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    /**
     * CORE LOGIC:
     * 1. Detects if a chapter is FREE or VIP.
     * 2. For VIP: Performs Deep Source Inspection to find hidden strings.
     * 3. For FREE: Extracts data from the visible DOM.
     * 4. Auto-saves to LocalStorage and navigates to the next chapter.
     */

    const CONFIG = {
        STORAGE_KEY: 'Justice_Final_Book',
        DELAY_NEXT: 3500, // Delay before jumping to next chapter
        MIN_CONTENT_LENGTH: 500
    };

    function initScraper() {
        const title = document.querySelector('h1')?.innerText.trim() || "Untitled_Chapter";
        let content = "";
        const htmlSource = document.documentElement.innerHTML;

        console.log(`%c[SYSTEM] Processing: ${title}`, "color: #3498db; font-weight: bold;");

        // --- PHASE 1: VIP DATA EXTRACTION (Hidden Strings) ---
        const vipPattern = /"([^"]{5000,})"/g; 
        const match = vipPattern.exec(htmlSource);

        if (match && match[1]) {
            try {
                const rawData = JSON.parse('"' + match[1] + '"');
                content = decodeURIComponent(rawData)
                    .replace(/\\n/g, '\n')
                    .replace(/\\u003Cbr \u002F\u003E/g, '\n')
                    .replace(/<br\s*\/?>/gi, '\n');
                console.log("%c[SUCCESS] Hidden VIP content decrypted!", "color: #2ecc71;");
            } catch (err) {
                console.error("[ERROR] Decryption failed:", err);
            }
        }

        // --- PHASE 2: FREE DATA EXTRACTION (DOM-based) ---
        if (!content || content.length < CONFIG.MIN_CONTENT_LENGTH) {
            const domContent = document.querySelector('.entry-content') || document.querySelector('#noi_dung_chuong');
            if (domContent) {
                content = domContent.innerText;
                console.log("%c[INFO] Standard content extracted.", "color: #f1c40f;");
            }
        }

        // --- PHASE 3: STORAGE ---
        if (content && content.length > CONFIG.MIN_CONTENT_LENGTH) {
            const savedData = localStorage.getItem(CONFIG.STORAGE_KEY) || "";
            if (!savedData.includes(title)) {
                localStorage.setItem(CONFIG.STORAGE_KEY, savedData + `\n\n=== ${title} ===\n\n${content}`);
                console.log(`%c[SAVE] Stored ${title} (${content.length} chars)`, "background: #27ae60; color: white; padding: 2px 5px;");
            }
        }

        // --- PHASE 4: AUTO-NAVIGATION ---
        handleNavigation();
    }

    function handleNavigation() {
        setTimeout(() => {
            const nextBtn = document.querySelector('a.btn-next') || 
                            document.querySelector('.next-chap') || 
                            Array.from(document.querySelectorAll('a')).find(el => 
                                /Chương sau|Next|Tiếp theo/.test(el.innerText)
                            );

            if (nextBtn && nextBtn.href && nextBtn.href !== window.location.href) {
                console.log("%c[NAV] Moving to next chapter...", "color: #e67e22;");
                nextBtn.click();
            } else {
                console.log("%c[FINISH] End of book or no next button found.", "color: #e74c3c; font-size: 16px;");
            }
        }, CONFIG.DELAY_NEXT);
    }

    // Expose download function to Global Scope
    window.downloadFile = function() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if(!data) return alert("No data found!");
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Decrypted_Book_Collection.txt';
        link.click();
    };

    window.addEventListener('load', initScraper);
})();
