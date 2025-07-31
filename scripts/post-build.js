import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// 复制文件函数
function copyFile(src, dest) {
  try {
    copyFileSync(src, dest);
    console.log(`✓ Copied ${src} to ${dest}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${src}:`, error.message);
  }
}

// 递归复制目录
function copyDir(src, dest) {
  try {
    mkdirSync(dest, { recursive: true });
    const items = readdirSync(src);
    
    for (const item of items) {
      const srcPath = join(src, item);
      const destPath = join(dest, item);
      const stat = statSync(srcPath);
      
      if (stat.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`✗ Failed to copy directory ${src}:`, error.message);
  }
}

console.log('🚀 Post-build processing...');

// 复制 manifest.json
copyFile('src/manifest.json', 'dist/manifest.json');

// 复制 override.html
copyFile('public/override.html', 'dist/override.html');

// 复制 public 目录中的文件（除了 override.html，因为已经单独复制了）
const publicFiles = readdirSync('public');
for (const file of publicFiles) {
  if (file !== 'override.html') {
    const srcPath = join('public', file);
    const destPath = join('dist', file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// 复制图标
copyDir('public/icons', 'dist/icons');

// 复制本地化文件
copyDir('public/_locales', 'dist/_locales');

console.log('✅ Post-build processing completed!'); 