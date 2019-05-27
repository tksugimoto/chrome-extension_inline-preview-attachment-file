"use strict";

const REGEXP_TARGET_ATTACHMENT = /^attachment; *filename="[^"]*[.](txt|md|pdf|png|jpe?g|gif)"/i;
const callback = details => {
	for (let i = 0; i < details.responseHeaders.length; ++i) {
		const responseHeader = details.responseHeaders[i];
		if (responseHeader.name.toLocaleLowerCase() === "content-disposition") {
			if (responseHeader.binaryValue) {
				const value = String.fromCharCode.apply(String, responseHeader.binaryValue);
				
				if (value.match(REGEXP_TARGET_ATTACHMENT)) {
					const fileExt = RegExp.$1;
					const binaryValue = responseHeader.binaryValue;
					binaryValue.splice(0, "attachment".length);
					const inline = "inline".split("").map(char => char.charCodeAt(0));
					responseHeader.binaryValue = inline.concat(binaryValue);
					changeContentType(details.responseHeaders, fileExt);
					return {
						responseHeaders: details.responseHeaders
					};
				}
			} else {
				const value = responseHeader.value;
				if (value.match(REGEXP_TARGET_ATTACHMENT)) {
					const fileExt = RegExp.$1;
					responseHeader.value = value.replace(/^attachment;/, "inline;");
					changeContentType(details.responseHeaders, fileExt);
					return {
						responseHeaders: details.responseHeaders
					};
				}
			}
			break;
		}
	}
	if (details.url.match(/[.](txt|md|pdf|png|jpe?g|gif)/)) {
		const fileExt = RegExp.$1;
		changeContentType(details.responseHeaders, fileExt);
		return {
			responseHeaders: details.responseHeaders
		};
	}
};
const filter = {
	urls: [
		// AWS
		"http://media.amazonwebservices.com/*",
		// skipaas
		"https://www.skipaas.com/*/attaches/*",
		"https://www.skipaas.com/*/event_report_documents/*"
	]
};
const opt_extraInfoSpec = [
	"blocking",
	"responseHeaders"
];

chrome.webRequest.onHeadersReceived.addListener(callback, filter, opt_extraInfoSpec);

// responseHeadersは配列なので参照渡し
// responseHeaderもObjectなので参照渡し
const changeContentType = (responseHeaders, fileExt) => {
	const contentType = contentTypes[fileExt] || `image/${fileExt}`;
	for (let i = 0; i < responseHeaders.length; ++i) {
		const responseHeader = responseHeaders[i];
		if (responseHeader.name.toLocaleLowerCase === "content-type") {
			responseHeader.value = contentType;
			return;
		}
	}
}

const contentTypes = {
	pdf: "application/pdf",
	txt: "text/plain",
	md: "text/plain"
};
