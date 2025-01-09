/**
 * 此文件用于处理 items.lua 中的装备数据，转换为JSON格式
 * items.lua 来源 https://github.com/Wolkenschutz/KeystoneLoot/blob/main/database/items.lua
 * 
 * 数据处理规则:
 * 1. 对原数据中缺少专精的职业进行补充，职业专精对照 classes.js，例如 { 73, 71, 72 } 补充为 [1] = { 73, 71, 72 }
 * 2. 如果物品包含所有职业的所有专精，则 classes 置为空对象
 * 3. 保留装备的 slotId，重命名为 slot_id
 * 4. 最终数据转为 json 输出到 items-data.json
 * 
 * 输出格式:
 * {
 *   "itemId": {
 *     "classes": { "classId": [specId, ...] },
 *     "slot_id": number
 *   }
 * }
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CLASSES } from './classes.js';
import * as luaparse from 'luaparse';

// 修复 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findClassBySpec(specId) {
  return CLASSES.find(c => c.specs.some(s => s.id === specId));
}

function getSpecsFromNode(node) {
  if (!node?.fields) return [];
  return node.fields
    .filter(f => f.value && typeof f.value.value === 'number')
    .map(f => f.value.value);
}

// 添加判断函数
function hasAllSpecs(classes) {
  for (const classData of CLASSES) {
    // 检查每个职业是否存在
    if (!classes[classData.id]) return false;
    
    // 检查该职业的所有专精是否都存在
    const itemSpecs = new Set(classes[classData.id]);
    for (const spec of classData.specs) {
      if (!itemSpecs.has(spec.id)) return false;
    }
  }
  return true;
}

function processItemNode(itemNode) {
  const result = { classes: {}, slot_id: null };
  
  if (!itemNode?.fields) return result;

  for (const field of itemNode.fields) {
    if (field.type === 'TableKeyString') {
      if (field.key.name === 'classes') {
        const classesTable = field.value;
        if (!classesTable?.fields) continue;

        // 处理 classes 数据
        for (const element of classesTable.fields) {
          if (element.type === 'TableKey' && element.key?.value) {
            // 带职业ID的专精
            const classId = element.key.value;
            const specs = getSpecsFromNode(element.value);
            if (specs.length > 0) {
              result.classes[classId] = specs;
            }
          } else if (element.type === 'TableValue') {
            // 无职业ID的专精组
            const specs = getSpecsFromNode(element.value);
            specs.forEach(specId => {
              const classData = findClassBySpec(specId);
              if (classData) {
                if (!result.classes[classData.id]) {
                  result.classes[classData.id] = [];
                }
                if (!result.classes[classData.id].includes(specId)) {
                  result.classes[classData.id].push(specId);
                }
              }
            });
          }
        }
      } else if (field.key.name === 'slotId' && field.value?.value !== undefined) {
        result.slot_id = field.value.value;
      }
    }
  }
  
  // 在返回结果前检查是否包含所有专精
  if (hasAllSpecs(result.classes)) {
    result.classes = {};
  }
  
  return result;
}

function main() {
  try {
    const luaPath = join(__dirname, 'items.lua');
    const content = readFileSync(luaPath, 'utf8');
    
    // 解析 Lua 代码
    const ast = luaparse.parse(content);
    
    // 查找 _items 表达式
    const items = {};
    const itemsNode = ast.body.find(node => 
      node.type === 'LocalStatement' && 
      node.variables[0].name === '_items'
    );
    
    if (itemsNode && itemsNode.init?.[0]?.fields) {
      // 遍历所有物品
      for (const field of itemsNode.init[0].fields) {
        if (field.key?.value) {
          const itemId = field.key.value;
          const itemData = processItemNode(field.value);
          if (Object.keys(itemData.classes).length > 0 || itemData.slot_id !== null) {
            items[itemId] = itemData;
          }
        }
      }
    }
    
    // 格式化输出
    const output = JSON.stringify(items, null, 2)
      .replace(/"classes":\s*{\s*([^}]+)\s*}/g, (_, p1) => 
        `"classes": { ${p1.replace(/\s+/g, ' ').trim()} }`
      );
    
    const outputPath = join(__dirname, 'items-data.json');
    writeFileSync(outputPath, output);
    console.log('Successfully processed data to items-data.json');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();