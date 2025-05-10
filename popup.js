document.addEventListener("DOMContentLoaded", () => {
	// DOM Elements
	const fileInput = document.getElementById("fileInput");
	const fileNameDisplay = document.getElementById("fileName");
	const separatorSelect = document.getElementById("separatorSelect");
	const filenameInput = document.getElementById("filenameInput");
	const extractButton = document.getElementById("extractButton");
	const extractButtonText = extractButton.querySelector("span:last-child");
	const extractSpinner = extractButton.querySelector(".spinner");
	const resultsArea = document.getElementById("resultsArea");
	const extractedEmailsTextarea = document.getElementById("extractedEmails");
	const emailCount = document.getElementById("emailCount");
	const copyAllBtn = document.getElementById("copyAllBtn");
	const downloadButton = document.getElementById("downloadButton");
	const messageBox = document.getElementById("messageBox");
	const fileExtensionSelect = document.getElementById("fileExtensionSelect");
	const domainFilterInput = document.getElementById("domainFilterInput");
	const filterDomainButton = document.getElementById("filterDomainButton");
	const domainsContainer = document.getElementById("domainsContainer");
	const exportAllButton = document.getElementById("exportAllButton");
	fileInput.multiple = true;

	let extractedEmails = [];
	let currentFilename = "extracted_emails";
	let emailDomains = {};
	let activeFiles = [];

	// Improved email regex
	const emailRegex =
		/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;

	// Event Listeners
	fileInput.addEventListener("change", handleFileSelect);
	extractButton.addEventListener("click", handleExtraction);
	separatorSelect.addEventListener("change", updateDisplayedEmails);
	copyAllBtn.addEventListener("click", copyAllEmails);
	downloadButton.addEventListener("click", downloadEmails);
	filenameInput.addEventListener("input", updateFilename);
	filterDomainButton.addEventListener("click", filterDomains);
	exportAllButton.addEventListener("click", exportAllDomains);
    

	// Functions
	function handleFileSelect() {
		if (fileInput.files.length > 0) {
			fileNameDisplay.textContent = `${fileInput.files.length} file(s) selected`;
			extractButton.disabled = false;
			showMessage("");
			resultsArea.classList.add("hidden");
			extractedEmails = [];
			emailDomains = {};
		} else {
			fileNameDisplay.textContent = "No files selected";
			extractButton.disabled = true;
		}
	}

	function getEmailDomain(email) {
		const domain = email.split("@")[1];
		const parts = domain.split(".");
		// Handle subdomains by grouping main domains
		return parts.length > 2 ? parts.slice(-2).join(".") : domain;
	}

	function displayResults() {
		// Display all emails as before
		displayEmails(extractedEmails);
		resultsArea.classList.remove("hidden");
		emailCount.textContent = `${extractedEmails.length} ${
			extractedEmails.length === 1 ? "email" : "emails"
		}`;

		// Display domain groups
		domainsContainer.innerHTML = "";

		// Sort domains by email count (descending)
		const sortedDomains = Object.keys(emailDomains).sort(
			(a, b) => emailDomains[b].length - emailDomains[a].length
		);

		sortedDomains.forEach((domain) => {
			const domainCard = document.createElement("div");
			domainCard.className = "domain-card";

			domainCard.innerHTML = `
            <div class="domain-header">
                <h3>${domain}</h3>
                <span class="domain-count">${emailDomains[domain].length} emails</span>
            </div>
            <div class="domain-actions">
                <button class="copy-domain" data-domain="${domain}">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    Copy
                </button>
                <button class="download-domain" data-domain="${domain}">
                    <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    Download
                </button>
            </div>
        `;

			domainsContainer.appendChild(domainCard);
		});
	}

	async function processMultipleFiles(files) {
		// Clear previous results
		extractedEmails = [];
		emailDomains = {};

		// Show loading state for all files
		extractButton.disabled = true;
		extractSpinner.style.display = "block";
		extractButtonText.textContent = `Processing ${files.length} files...`;

		try {
			// Process files sequentially to avoid memory issues
			for (const file of files) {
				try {
					const fileContent = await readFileAsText(file);
					const emails = fileContent.match(emailRegex) || [];

					// Update loading state for current file
					extractButtonText.textContent = `Processing ${file.name}...`;

					// Process emails from this file
					emails.forEach((email) => {
						const cleanEmail = email.trim().toLowerCase();
						if (isValidEmail(cleanEmail)) {
							// Add to master list (duplicates will be removed later)
							extractedEmails.push(cleanEmail);

							// Group by domain
							const domain = getEmailDomain(cleanEmail);
							if (!emailDomains[domain]) {
								emailDomains[domain] = [];
							}
							// Only add if not already present for this domain
							if (!emailDomains[domain].includes(cleanEmail)) {
								emailDomains[domain].push(cleanEmail);
							}
						}
					});
				} catch (error) {
					console.error(`Error processing ${file.name}:`, error);
					showMessage(`Error processing ${file.name}`, "error");
				}
			}

			// Remove duplicates from all emails
			extractedEmails = [...new Set(extractedEmails)];

			if (extractedEmails.length > 0) {
				displayResults();
				showMessage(
					`Processed ${files.length} file(s). Found ${extractedEmails.length} unique emails.`,
					"success"
				);
			} else {
				showMessage("No valid emails found in the files.", "warning");
			}
		} catch (error) {
			console.error("Error processing files:", error);
			showMessage("Failed to process files", "error");
		} finally {
			// Reset loading state
			extractButton.disabled = false;
			extractSpinner.style.display = "none";
			extractButtonText.textContent = "Extract Emails";
		}
	}

	function filterDomains() {
		const filter = domainFilterInput.value.trim().toLowerCase();
		if (!filter) return;

		const filteredDomains = {};
		let totalFiltered = 0;

		Object.keys(emailDomains).forEach((domain) => {
			if (domain.includes(filter)) {
				filteredDomains[domain] = emailDomains[domain];
				totalFiltered += emailDomains[domain].length;
			}
		});

		if (Object.keys(filteredDomains).length > 0) {
			emailDomains = filteredDomains;
			displayResults();
			showMessage(
				`Found ${totalFiltered} emails in matching domains`,
				"success"
			);
		} else {
			showMessage("No domains match your filter", "warning");
		}
	}

	async function exportAllDomains() {
		if (Object.keys(emailDomains).length === 0) {
			showMessage("No domains to export", "warning");
			return;
		}

		const zip = new JSZip();
		const separator =
			separatorSelect.value === "\\n"
				? "\n"
				: separatorSelect.value === "\\t"
				? "\t"
				: separatorSelect.value;

		// Add each domain as a separate file
		for (const domain in emailDomains) {
			const content = emailDomains[domain].join(separator);
			const filename = `${currentFilename}_${domain.replace(/\./g, "_")}${
				fileExtensionSelect.value
			}`;
			zip.file(filename, content);
		}

		// Generate and download the ZIP
		const zipContent = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(zipContent);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${currentFilename}_domains.zip`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		showMessage("All domains exported as separate files", "success");
	}

	domainsContainer.addEventListener("click", (e) => {
		const domain = e.target.closest("button")?.dataset.domain;
		if (!domain) return;

		if (e.target.closest(".copy-domain")) {
			copyDomainEmails(domain);
		} else if (e.target.closest(".download-domain")) {
			downloadDomainEmails(domain);
		}
	});

	function copyDomainEmails(domain) {
		const emails = emailDomains[domain];
		if (!emails || emails.length === 0) {
			showMessage(`No emails found for ${domain}`, "warning");
			return;
		}

		const separator =
			separatorSelect.value === "\\n"
				? "\n"
				: separatorSelect.value === "\\t"
				? "\t"
				: separatorSelect.value;

		navigator.clipboard
			.writeText(emails.join(separator))
			.then(() =>
				showMessage(`Copied ${emails.length} ${domain} emails`, "success")
			)
			.catch((err) => showMessage("Failed to copy emails", "error"));
	}

	async function downloadDomainEmails(domain) {
		const emails = emailDomains[domain];
		if (!emails || emails.length === 0) {
			showMessage(`No emails found for ${domain}`, "warning");
			return;
		}

		const separator =
			separatorSelect.value === "\\n"
				? "\n"
				: separatorSelect.value === "\\t"
				? "\t"
				: separatorSelect.value;

		const extension = fileExtensionSelect.value;
		let content, mimeType, blob;

		try {
			switch (extension) {
				case ".csv":
					mimeType = "text/csv";
					content = emails.join(separator === "\t" ? "\t" : ",");
					blob = new Blob([content], { type: mimeType });
					break;
				case ".json":
					mimeType = "application/json";
					content = JSON.stringify(emails, null, 2);
					blob = new Blob([content], { type: mimeType });
					break;
				case ".pdf":
					blob = await generatePDF(
						emails,
						separator,
						`${currentFilename}_${domain.replace(/\./g, "_")}`
					);
					break;
				case ".doc":
					blob = await generateDOCX(emails, separator);
					break;
				default: // .txt
					mimeType = "text/plain";
					content = emails.join(separator);
					blob = new Blob([content], { type: mimeType });
			}

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${currentFilename}_${domain.replace(
				/\./g,
				"_"
			)}${extension}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			showMessage(`Downloaded ${emails.length} ${domain} emails`, "success");
		} catch (error) {
			console.error("Domain export error:", error);
			showMessage("Failed to export domain emails", "error");
		}
	}

	function updateFilename() {
		currentFilename = filenameInput.value.trim() || "extracted_emails";
	}

	async function handleExtraction() {
		if (fileInput.files.length === 0) {
			showMessage("Please select files first", "error");
			return;
		}

		extractButton.disabled = true;
		extractSpinner.style.display = "block";
		extractButtonText.textContent = "Processing...";

		try {
			await processMultipleFiles(Array.from(fileInput.files));
		} catch (error) {
			showMessage(`Error: ${error.message}`, "error");
		} finally {
			extractButton.disabled = false;
			extractSpinner.style.display = "none";
			extractButtonText.textContent = "Extract Emails";
		}
	}

	function readFileAsText(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target.result);
			reader.onerror = () => reject(new Error("Failed to read file"));
			reader.readAsText(file);
		});
	}

	function extractEmails(text) {
		const emails = text.match(emailRegex) || [];

		// Process emails
		extractedEmails = [...new Set(emails)]
			.map((email) => email.trim().toLowerCase())
			.filter((email) => isValidEmail(email));

		if (extractedEmails.length > 0) {
			displayEmails(extractedEmails);
			resultsArea.classList.remove("hidden");
			emailCount.textContent = `${extractedEmails.length} ${
				extractedEmails.length === 1 ? "email" : "emails"
			}`;
			showMessage(
				`Successfully extracted ${extractedEmails.length} unique email addresses.`,
				"success"
			);
		} else {
			extractedEmails = [];
			resultsArea.classList.add("hidden");
			showMessage("No valid email addresses found in the file.", "warning");
		}
	}

	function isValidEmail(email) {
		const parts = email.split("@");
		if (parts.length !== 2) return false;
		if (parts[0].length > 64) return false;
		if (parts[1].length > 255) return false;

		const domainParts = parts[1].split(".");
		if (domainParts.some((part) => part.length > 63)) return false;

		return true;
	}

	function displayEmails(emails) {
		const separator =
			separatorSelect.value === "\\n"
				? "\n"
				: separatorSelect.value === "\\t"
				? "\t"
				: separatorSelect.value;

		extractedEmailsTextarea.value = emails.join(separator);
	}

	function updateDisplayedEmails() {
		if (extractedEmails.length > 0) {
			displayEmails(extractedEmails);
		}
	}

	function copyAllEmails() {
		if (extractedEmails.length === 0) {
			showMessage("No emails to copy.", "warning");
			return;
		}

		extractedEmailsTextarea.select();
		document.execCommand("copy");

		// Visual feedback
		const originalHTML = copyAllBtn.innerHTML;
		copyAllBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
        `;

		setTimeout(() => {
			copyAllBtn.innerHTML = originalHTML;
		}, 2000);

		showMessage("All emails copied to clipboard!", "success");
	}

	function showMessage(message, type = "info") {
		messageBox.textContent = message;
		messageBox.className = `message-box ${type}`;
		messageBox.classList.remove("hidden");

		if (!message) {
			messageBox.classList.add("hidden");
			return;
		}

		// Auto-hide success messages after 4 seconds
		if (type === "success") {
			setTimeout(() => {
				messageBox.classList.add("hidden");
			}, 4000);
		}
	}

	// PDF Generation with PDFKit
	async function generatePDF(emails, separator, filename) {
		return new Promise((resolve) => {
			// Create a PDF document
			const doc = new PDFDocument();
			const stream = doc.pipe(blobStream());

			// Set document metadata
			doc.info["Title"] = `Extracted Emails - ${filename}`;
			doc.info["Author"] = "Email Extractor Pro";

			// Add title
			doc
				.font("Helvetica-Bold")
				.fontSize(20)
				.text("Extracted Email Addresses", { align: "center" });

			doc.moveDown();

			// Add generation date
			doc
				.font("Helvetica")
				.fontSize(10)
				.text(`Generated on ${new Date().toLocaleString()}`, {
					align: "center",
				});

			doc.moveDown(2);

			// Add emails
			doc
				.font("Helvetica")
				.fontSize(12)
				.text(emails.join(separator + "\n"), {
					align: "left",
					indent: 30,
					paragraphGap: 5,
				});

			// Add footer
			doc
				.fontSize(8)
				.text("Created with Email Extractor Pro", 50, doc.page.height - 50, {
					align: "center",
					width: doc.page.width - 100,
				});

			doc.end();

			stream.on("finish", () => {
				resolve(stream.toBlob("application/pdf"));
			});
		});
	}

	// DOCX Generation with docx
	async function generateDOCX(emails, separator) {
		const { Document, Paragraph, TextRun, HeadingLevel, Packer } = docx;

		const doc = new Document({
			title: "Extracted Email Addresses",
			description: "Generated by Email Extractor Pro",
			creator: "Email Extractor Pro",
			styles: {
				paragraphStyles: [
					{
						id: "normal",
						name: "Normal",
						run: {
							font: "Calibri",
							size: 24,
						},
						paragraph: {
							spacing: {
								line: 276,
							},
						},
					},
				],
			},
			sections: [
				{
					properties: {},
					children: [
						new Paragraph({
							text: "Extracted Email Addresses",
							heading: HeadingLevel.HEADING_1,
							spacing: {
								after: 200,
							},
						}),
						new Paragraph({
							text: `Generated on ${new Date().toLocaleString()}`,
							spacing: {
								after: 400,
							},
						}),
						new Paragraph({
							children: emails.map(
								(email) =>
									new TextRun({
										text: email + (separator === "\n" ? "\n" : " "),
										break: separator === "\n" ? 1 : 0,
									})
							),
						}),
						new Paragraph({
							text: "Created with Email Extractor Pro",
							spacing: {
								before: 600,
							},
							style: "normal",
						}),
					],
				},
			],
		});

		return await Packer.toBlob(doc);
	}

	async function downloadEmails() {
		if (extractedEmails.length === 0) {
			showMessage("No emails to download.", "warning");
			return;
		}

		const separator =
			separatorSelect.value === "\\n"
				? "\n"
				: separatorSelect.value === "\\t"
				? "\t"
				: separatorSelect.value;

		let content,
			mimeType,
			extension = fileExtensionSelect.value;
		let blob;

		try {
			showMessage("Preparing download...", "info");

			switch (extension) {
				case ".csv":
					mimeType = "text/csv";
					content = extractedEmails.join(separator === "\t" ? "\t" : ",");
					blob = new Blob([content], { type: mimeType });
					break;
				case ".json":
					mimeType = "application/json";
					content = JSON.stringify(extractedEmails, null, 2);
					blob = new Blob([content], { type: mimeType });
					break;
				case ".pdf":
					blob = await generatePDF(extractedEmails, separator, currentFilename);
					break;
				case ".doc":
					blob = await generateDOCX(extractedEmails, separator);
					break;
				default: // .txt
					mimeType = "text/plain";
					content = extractedEmails.join(separator);
					blob = new Blob([content], { type: mimeType });
			}

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${currentFilename}${extension}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			setTimeout(() => {
				URL.revokeObjectURL(url);
				showMessage("Download complete!", "success");
			}, 100);
		} catch (error) {
			console.error("Export error:", error);
			showMessage("Failed to generate file. Please try again.", "error");
		}
	}
});
