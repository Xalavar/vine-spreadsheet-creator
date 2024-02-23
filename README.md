# vine-spreadsheet-creator


# FAQ:

Acronyms: TM = Tampermonkey, GM = Greasemonkey

Q: What exactly is this and what does it do?
A: This is a script that allows you to compile all of your Vine orders into a database that can then be exported as a spreadsheet.

Q: I already have a spreadsheet, so I don't need this.
A: Congrats, I guess? I know about the method of highlighting everything in the Orders page and copy-pasting the page into a spreadsheet ad nauseum, but
   doing that for every new order is tiresome. I find it easier to just go to my order page and click a button to generate a newly updated spreadsheet.

Q: Where/how is data stored?
A: All data is stored locally in your browser via IndexedDB. To save data, you just go through each page in your Orders tab until you reach the start of the current year (or previous years if you want).
   The data from each Order page is saved. If a page contains X data of a product you ordered, it will be saved.

Q: What data is stored?
A: Only the data you see in the spreadsheets this script exports. That includes details of the product, your order numbers, order dates, etc.
   You can also see what data is stored by clicking the Storage tab when viewing this script in TM/GM.
   If you want to see specifically what data is saved, you can view the full database in your browser's dev tools.

Q: Do you have access to our information too?
A: No. This script does not make any attempts to access the internet in any way.

Q: Is there a ban risk to using this? Does it send any data to Amazon?
A: Not if you're clicking each page manually. This script merely saves the data currently on the page (you can see which pages it's active in) and isn't interacting with Amazon's services in any way.

Q: Doesn't Amazon ban people who use scripts or automation tools?
A: Amazon explicitly stated that "[using] robots (“bots”), scripts, or other similar automation tools to automatically SELECT/ORDER Vine items" will get you kicked out of Vine.
   This script does not match that criteria, so it's safe to use.

Q: I already have an existing Google Sheets spreadsheet, but the data in yours and mine are arranged differently.
A:

Q: Why a script instead of a browser extension or a downloadable program?
A: Out of all the different ways I could have implemented something like this, I chose Tampermonkey because it's super easy to make changes on the fly.
   While I could have made this into an extension, that would require having to get it approved for at least Chrome and Firefox, and I'd rather only have to maintain one version.
   I could have made this into a Python program, but given the vast age range of people in Vine, I felt more compelled to go with a simpler approach, since some people aren't computer-savvy.
   Plus, there are other reasons why I avoided those two approaches. I don't want to get on Amazon's bad side and I'd likely be pestered by non-Vine members who merely found the extension through a search asking for an invitation to the program.

Q: Which browsers is this script compatible with?
A: Any browser that can install Tampermonkey or Greasemonkey, which to my knowledge includes Chrome, Firefox, and Edge. This was primarily tested in Chrome, but I'm confident this works in Firefox and Edge too.

Q: Do spreadsheets work in all versions of Excel? How about Google Sheets?
A: Yes* and yes. Exported spreadsheets are compatible with both Excel and Google Sheets.
   I can confirm that this works flawlessly with version 2302 of Excel.
   *If you're using an older version of Excel that doesn't have certain features, you might want to use Google Sheets instead.

Q: What does "excluding" a product mean?
A: It means that the ETV of that product will be excluded from your ETV total. You can also change this in Excel/Sheets.
   This is mainly for people who cancelled an order or received a defective/damaged product and had Vine CS remove it from their tax totals.
   Note: This script does NOT know if your orders are going to be excluded from your ETV total by the end of the year, so you must update this for each item manually.

Q: The spreadsheet says a product was deleted, but when I click the link, the product page is still there.
A: The short answer: Vine's item tracking is bugged. Even Amazon doesn't know if items were actually deleted sometimes.
   This seems to be a bug on Amazon's end. I'm deliberating on how to go about remedying this.

Q: Can this save product photos?
A: No, not at the moment. I want to add this in, but there are a few problems:
* Excel doesn't support inserting images directly into cells.
* Images take up a lot of space.
However, I could try saving the image URLs and allowing people to paste them into Google Sheets. (I haven't used Sheets that extensively, so I'm not sure if this will work or not.)

Q: Any plans for saving other information to spreadsheets, like review date and seller?
A: Absolutely! Here's a list of things I'd like to add:
* Review submission date
* Review approval date
* Review title + stars + URL (less likely to happen since Vine's Review page no longer shows that information.)
* The queue in which the item was requested. (Would require the script being active in the queues.)
* Seller name + URL (if applicable)
* Shipment carrier (USPS, Amazon, etc.)
* Date shipped
* Date delivered
* Evaluation dates and # of items requested during each evaluation period
More complex methods of obtaining such info might be required though. Maybe in the far future, I'll implement the ability to upload emails sent from Amazon and parse through them.

Q: Can this create graphs as well?
A: Unfortunately, that's one of the limitations of the library I'm using. It can't create graphs, only tables.
   My hope is that maybe the community might help out when it comes to making graphs, but I feel like tables should be sufficient enough for most people's needs.
