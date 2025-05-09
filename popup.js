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

	let extractedEmails = [];
	let currentFilename = "extracted_emails";

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

	// Functions
	function handleFileSelect() {
		if (fileInput.files.length > 0) {
			const file = fileInput.files[0];
			fileNameDisplay.textContent = file.name;
			extractButton.disabled = false;
			showMessage("");
			resultsArea.classList.add("hidden");
			extractedEmails = [];
		} else {
			fileNameDisplay.textContent = "No file selected";
			extractButton.disabled = true;
		}
	}

	function updateFilename() {
		currentFilename = filenameInput.value.trim() || "extracted_emails";
	}

	async function handleExtraction() {
		const file = fileInput.files[0];
		if (!file) {
			showMessage("Please select a file first.", "error");
			return;
		}

		// Show loading state
		extractButton.disabled = true;
		extractSpinner.style.display = "block";
		extractButtonText.textContent = "Processing...";

		try {
			const fileContent = await readFileAsText(file);
			extractEmails(fileContent);
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
