import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const lootPath = join(__dirname, 'loot.json');
  const content = readFileSync(lootPath, 'utf8');
  
  // 解析 JSON 内容
  const jsonObjects = content.match(/\{[\s\S]*?\}/g);
  const itemsData = JSON.parse(jsonObjects[1]); // 获取第二个对象(物品数据)
  
  // 过滤 slotId = 3 的物品
  const slot3Items = Object.entries(itemsData)
    .filter(([_, item]) => item.slotId === 3)
    .map(([id]) => id);
    
  console.log('slotId = 3 的物品ID:', slot3Items.join(', '));
  console.log('共找到', slot3Items.length, '个物品');
  
} catch (error) {
  console.error('处理失败:', error);
}