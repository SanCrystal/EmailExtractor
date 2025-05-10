# 📧 Email Extractor Pro - Chrome Extension

**Author**: Santa  
**Version**: 2.0  
**License**: MIT  

![Extension Screenshot](screenshot.png)

## 🌟 Enhanced Features

### 🆕 Multi-File Processing
- Upload and process **multiple files simultaneously** (TXT, CSV)
- Combined email extraction across all files
- Progress indicators for batch processing
- File size validation (10MB limit per file)

### 🔍 Advanced Domain Management
- **Automatic domain separation** (gmail.com, outlook.com, etc.)
- **Domain filtering** - quickly find specific email providers
- Visual domain distribution cards
- Domain-specific email counts

### 🗂 Multi-Format Export Options
- **Individual domain exports** (copy/download specific domains)
- **Bulk export all domains** as ZIP archive
- Export formats for domains match main settings
- Preserved folder structure in ZIP exports

### 🛠 Existing Powerful Features
- Duplicate email removal
- Multiple output separators (comma, tab, pipe, etc.)
- Various export formats (TXT, CSV, PDF, DOCX, JSON)
- Clean, professional interface

## 📦 Installation

### Chrome Web Store (Recommended)
1. Visit [Chrome Web Store listing](#) (coming soon)
2. Click "Add to Chrome"
3. Confirm installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder

## 🚀 Usage Guide

### Basic Workflow
1. Click the extension icon in your Chrome toolbar
2. Upload one or more files using "Choose Files" button
3. Monitor progress in real-time
4. View extracted emails and domain distribution
5. Export results:
   - Copy/download all emails
   - Copy/download specific domains
   - Export all domains as ZIP package

### Advanced Features
- **Domain Filtering**:
  - Type in the filter box to show only matching domains
  - Click "Filter" button to apply
  
- **Bulk Domain Export**:
  - Click "Export All Domains" to generate ZIP
  - Each domain becomes a separate file
  - Maintains your preferred format/separator

- **Multi-File Tips**:
  - Process up to 10 files at once
  - Total size limit: 50MB
  - Cancel processing by closing popup

## 🛠 Technical Details

### System Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Key Libraries**:
  - PDFKit (PDF generation)
  - docx.js (Word document generation)
  - JSZip (ZIP archive creation)
- **Chrome APIs**: ActiveTab, Downloads

### Performance
- Processes ~10,000 emails/second
- Memory-efficient streaming processing
- Progressive UI updates during long operations

## 📂 Project Structure

```
/email-extractor-pro
├── /icons                   # Extension icons
│   ├── mail-16.png          # 16x16px
│   ├── mail-32.png          # 32x32px
│   ├── mail-48.png          # 48x48px
│   └── mail-128.png         # 128x128px
├── /lib                     # Third-party libraries
│   ├── pdfkit.standalone.js # PDF generation
│   ├── blobStream.js        # Stream handling
│   ├── docx.iife.js         # Word document generation
│   └── jszip.min.js         # ZIP archive functionality
├── popup.html               # Main interface
├── popup.css                # Stylesheet
├── popup.js                 # Core functionality
└── manifest.json            # Extension configuration
```

## 🐛 Troubleshooting

**Issue**: Files not processing  
✅ Solution: 
- Check file types (.txt or .csv only)
- Verify file size <10MB
- Try fewer files at once

**Issue**: Missing some emails  
✅ Solution:
- Check for non-standard email formats
- Verify files contain properly formatted emails
- Try different separator options

**Issue**: ZIP export fails  
✅ Solution:
- Ensure you have storage permissions
- Try smaller export sets
- Check available disk space

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Santa - [codemafia.dev@gmail.com](#)

Project Link: [https://github.com/sanCrystal/email-extractor-pro](#)

---

**Version History**:
- v2.0 - Added multi-file support, domain separation, bulk exports
- v1.2 - Enhanced export options and UI improvements
- v1.0 - Initial release with basic extraction features