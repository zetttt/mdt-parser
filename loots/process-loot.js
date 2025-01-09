/**
 * 此文件用于从 items-data.json 中查找 loot.json 中存放 boss数据下的 装备id
 * 查找结果将输出到 loot.json 文件底部
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  try {
    const lootPath = join(__dirname, 'loot.json');
    const itemsPath = join(__dirname, 'items-data.json');
    
    // 读取并解析文件内容
    const content = readFileSync(lootPath, 'utf8');
    const itemsData = JSON.parse(readFileSync(itemsPath, 'utf8'));

    // 检查是否已包含装备数据
    const jsonObjects = content.match(/\{[\s\S]*?\}/g);
    if (jsonObjects && jsonObjects.length > 1) {
      console.log('装备数据已获取，无需重复处理');
      return;
    }

    const lootData = JSON.parse(jsonObjects[0]);
    
    // 提取装备ID
    const itemIds = new Set();
    Object.entries(lootData).forEach(([key, ids]) => {
      if (!key.startsWith('_')) {
        ids.forEach(id => itemIds.add(id.toString()));
      }
    });

    // 查找装备数据
    const foundItems = {};
    itemIds.forEach(id => {
      if (itemsData[id]) {
        foundItems[id] = itemsData[id];
      }
    });

    // 构造输出数据
    const bossData = {};
    Object.entries(lootData).forEach(([key, value]) => {
      if (!key.startsWith('_')) {
        bossData[key] = value;
      }
    });

    // 构造输出字符串
    const output = JSON.stringify(bossData, null, 2) + 
      '\n// 总计装备ID: ' + itemIds.size + 
      '\n// 找到装备数: ' + Object.keys(foundItems).length + '\n' +
      JSON.stringify(foundItems, null, 2).replace(/"classes":\s*{\s*([^}]+)\s*}/g, 
        (_, p1) => `"classes": { ${p1.replace(/\s+/g, ' ').trim()} }`);

    writeFileSync(lootPath, output);
    console.log(`处理完成:
总计装备ID: ${itemIds.size}
找到装备数: ${Object.keys(foundItems).length}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

main();