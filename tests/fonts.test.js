import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('numeric readouts and tide SVG use the designated font with all form controls',()=>{
 assert.doesNotMatch(['src/styles.css',...['01-base-layout','02-chapter-activities','03-report-settings','04-challenge','05-records-responsive'].map(n=>`src/styles/${n}.css`)].map(read).join('\n'),/font-family:\s*monospace/);assert.match(read('src/screens.js'),/font-family="NanumSquareNeo,sans-serif"/);assert.match(read('src/experience.css'),/body,button,input,select,textarea/);assert.match(read('src/design-tokens.css'),/font-family: 'NanumSquareNeo'/);
});
