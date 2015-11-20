"use strict";function Queue(e){this.window=e,this.items=[],this.openingTab=!1}function Item(e,A,t,n,i){this.id=e,this.window=A,this.url=t,this.state=n,this.locked=i}function setLock(e,A,t){var n=getQueue(e).items;n.length>0&&(n[A].locked=t,cleanAndStore())}function moveItemInQueue(e,A,t){var n=getQueue(e).items;n.move(A,t),cleanAndStore()}function getQueue(e){for(var A=0;A<queues.length;A++)if(queues[A].window==e)return queues[A];var t=new Queue(e);return queues.push(t),t}function findTabWaiting(e,A){for(var t=0;t<tabsWaiting.length;t++)if(e===tabsWaiting[t].id)return A&&tabsWaiting.splice(t,1),!0;return!1}function findInQueue(e,A){for(var t=0;t<e.length;t++)if(e[t].url===A)return t;return-1}function isInWhitelist(e){for(var A=0;A<whitelist.length;A++)if(whitelist[A].test(e))return!0;return!1}function removeQueue(e){queues.splice(e,1),cleanAndStore()}function clearQueues(){queues=[],cleanAndStore()}function clearItems(e){var A=getQueue(e);A.items=[],cleanAndStore()}function queueTab(e){if(!isInWhitelist(e.url)){var A=new Item(e.id,e.windowId,e.url,e.status,!1);saveItem(A),isQueuing=!0,chrome.tabs.remove(e.id,function(){void 0!==chrome.runtime.lastError})}}function compareById(e,A){return e.id<A.id?-1:e.id>A.id?1:0}function queueToLimit(e){chrome.tabs.query({windowId:e,pinned:!1},function(e){for(var A=0;A<e.length;A++)isInWhitelist(e[A].url)&&(e.splice(A,1),A--);if(e.length>tabLimit){queueByRecent&&(e=e.sort(compareById));for(var A=tabLimit;A<e.length;A++)queueTab(e[A])}})}function saveItem(e){var A=getQueue(e.window).items;if(!allowDuplicates){var t=findInQueue(A,e.url);if(t>=0)return void A.move(t,0)}A.push(e),cleanAndStore()}function removeItem(e,A){var t=getQueue(e).items;t.splice(A,1),cleanAndStore()}function setActive(e){isActive=e,chrome.storage.local.set({isActive:isActive});var A=isActive?ICON_DEFAULT:ICON_DISABLED;isActive?setUpdater():window.clearInterval(updater),chrome.browserAction.setIcon({path:A})}function updateBadgeCounter(){chrome.tabs.query({currentWindow:!0,active:!0},function(e){var A=e[0];if(A){var t="#00ff00",n=getQueue(A.windowId).items;n.length>0&&(t="#ff0000"),chrome.browserAction.setBadgeBackgroundColor({color:t}),chrome.browserAction.setBadgeText({text:n.length.toString(),tabId:A.id})}})}function init(){function e(e){if(void 0!==chrome.runtime.lastError)return void console.error("An error ocurred initializing options: "+chrome.runtime.lastError.string);e.hasOwnProperty("tabLimit")&&(tabLimit=e.tabLimit),e.hasOwnProperty("allowDuplicates")&&(allowDuplicates=e.allowDuplicates),e.hasOwnProperty("allowDuplicates")&&(queueByRecent=e.queueByRecent),e.hasOwnProperty("isActive")&&(isActive=e.isActive);var A=isActive?ICON_DEFAULT:ICON_DISABLED;chrome.browserAction.setIcon({path:A}),e.hasOwnProperty("queues")&&(queues=JSON.parse(e.queues)),initQueues(),setUpdater(),e.hasOwnProperty("restoreOnStart")&&e.restoreOnStart&&restoreSavedQueues(),e.hasOwnProperty("hideContextMenu")&&!e.hideContextMenu&&createContextMenu()}document.removeEventListener("DOMContentLoaded"),chrome.storage.local.get(null,e)}function initQueues(){if(0!==queues.length)for(var e=0;e<queues.length;e++){var A=queues[e];A.window=DEFAULT_ID;for(var t=0;t<A.items.length;t++)A.items[t].window=DEFAULT_ID}}function setUpdater(){updater=window.setInterval(function(){isActive&&(chrome.windows.getAll({populate:!0},function(e){for(var A=0;A<e.length;A++)"normal"===e[A].type&&checkOpenNextItems(e[A])}),updateBadgeCounter())},1e3)}function checkOpenNextItems(e){if(0!=e.tabs.length){for(var A=getQueue(e.id).items,t=0,n=0;n<e.tabs.length;n++)isInWhitelist(e.tabs[n].url)||e.tabs[n].pinned||t++;var i=tabLimit-t;if(itemsToOpen=i,i>0&&A.length>0)for(var o=0;i>0&&o<A.length;)A[o].locked?o++:(chrome.tabs.create({windowId:e.id,url:A[o].url,active:!1}),removeItem(e.id,o),i--)}}function openUrlInTab(e,A,t,n,i){isOverriding=n,i?chrome.tabs.update({url:A}):t>-1?chrome.tabs.create({windowId:e,url:A,index:t,active:!1}):chrome.tabs.create({windowId:e,url:A,active:!1})}function openQueueInWindow(e){chrome.windows.create({focused:!1},function(A){e.window=A.id;for(var t=e.items,n=0;n<t.length;n++)t[n].window=A.id})}function restoreQueue(e){queues.length<=e||openQueueInWindow(queues[e])}function restoreSavedQueues(){for(var e=0;e<queues.length;e++)queues[e].window===DEFAULT_ID&&openQueueInWindow(queues[e])}function onSettingsChanged(e,A){var t,n,i;for(t in e)e.hasOwnProperty(t)&&(n=e[t],i=n.newValue,"tabLimit"===t?tabLimit=i:"allowDuplicates"===t?allowDuplicates=i:"queueByRecent"===t?queueByRecent=i:"hideContextMenu"===t&&(i?chrome.contextMenus.removeAll():createContextMenu()))}function cleanAndStore(){if(!storing){storing=!0;var e=window.setTimeout(function(){for(var A=0;A<queues.length;)0===queues[A].items.length?queues.splice(A,1):A++;var t=JSON.stringify(queues);chrome.storage.local.set({queues:t},function(){void 0!==chrome.runtime.lastError&&(console.error("An error ocurred saving queues: "+chrome.runtime.lastError.string),console.error(chrome.runtime.lastError))}),window.clearTimeout(e),storing=!1},2e3)}}function createContextMenu(){chrome.contextMenus.create({title:"Open link in new tab (don't queue)",contexts:["link"],onclick:onContextMenuLinkClicked})}function onCreatedTab(e){isActive&&(isOverriding||tabsWaiting.push(e),isOverriding=!1)}function onUpdatedTab(e,A,t){isActive&&!A.pinned&&findTabWaiting(e,!0)&&chrome.tabs.query({windowId:t.windowId},function(e){for(var A=0,n=0;n<e.length;n++)isInWhitelist(e[n].url)||e[n].pinned||A++;tabLimit>=A||queueTab(t)})}function onWindowRemoved(e){var A=getQueue(e);if(A.items.length>0){A.window=DEFAULT_ID;for(var t=0;t<A.items.length;t++)A.items[t].window=DEFAULT_ID}}function onContextMenuLinkClicked(e,A){openUrlInTab(A.windowId,e.linkUrl,A.index+1,!0,!1)}var DEFAULT_ID=-1,whitelist=[/^chrome[:|-].*/],isActive=!0,isQueuing=!1,isOverriding=!1,storing=!1,updater=null,itemsToOpen=0,tabsWaiting=[],tabLimit=10,allowDuplicates=!1,queueByRecent=!1,queues=[],ICON_DEFAULT="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAAqElEQVR4nO3aQQrCQBBE0Y54/yOrW5GABI0fmfeWs2iKYtLMIjMAAMCKtpm5nzDz2afzT513+XDY31NAHaB23Tl7/ebe+fYO+anlb4AC6gC1vXeAHbASBdQBanvvgKOO7ozSNjO354Plb4AC6gA1BdQBagqoA9QUUAeoKaAOUFNAHaCmgDpATQF1gJoC6gA1BdQBagqoA9TO+Eforyx/AxRQBwAAACg8AEejCFAaFqVwAAAAAElFTkSuQmCC",ICON_DISABLED="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAABcVBMVEUAAAD/AAD///8AAAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAAAAAABAAADAAAGAAAKAAAPAAAVAAAcAAAiAAAjAAApAAAtAAA3AABCAABHAABQAABZAABjAABpAAB4AAB6AACHAACQAACbAACkAACxAAC9AAC/AADCAADIAADPAADXAADbAADjAADqAADuAADxAAD1AAD5AAD8AAD+AAD/AAB4L4E0AAAAUXRSTlMAAAABAQMFBgcJCgsMDQ8VFhweICUnKi0uNDY3QkNGTlJUVVhgYmVnaXh5iIuMj52foKGio66wsba5vb7CyMnKzM7W2drb4+bq6/Dz9ff5/P5esCL3AAABx0lEQVR42u3XR1MCQRCGYXoFs6yKGRRzzjlnESOOOeecxTy/Xl3Lni1Bl25ult9xtt7n1oe1aVHuHwgDgMVKm2OjArwB2ZkUBeCZkVL262wgd1J+bMTFBDL88nPjOSwgzSe/1ssB9GHsx1IVIMIM3hfyltKHfXBdGLO9L2Igrhv7h01BBxbasH/aEnRg/hT75x0RAthMCw8cY/+yJxjAocQdCAaw/4r9kWAAuy/YnwhrIGTbz9ifzYd8tQa2HrE/XxB0YOMe+8slQQdWg9jfLItIgG8HNKoOSDdebGox1oBzAHufC+hAvDqgiWygA44O7KfdQAfsjdjP5gMDqMU+UAwMoAr7uUpgABVzCFQBAygKYF8HDMAzi32TnQG4p7HvcAAdyPZj350AdCDdh/2gE+iAPmY+IDrgHFIHlAZ0ILEHe38W0AHTAU25gQ7YW9UBeYAB1KsDKgQGUK0OqBwYQKU0HRADKFEHVAMMoEAdUIOdAZgOqN0BJMDY5gP2F4si4iGwFsT+elnQgZU77G9XBAO4wj64KmiAZixn/OuAMuH3/fS/4Box+sk8YAKaPmAckMYGtOQuGfBqDAAX11KmWQP//41/EngDrVcKealcgDwAAAAASUVORK5CYII=";Array.prototype.move=function(e,A){for(;0>e;)e+=this.length;for(;0>A;)A+=this.length;if(A>=this.length)for(var t=A-this.length;t--+1;)this.push(void 0);return this.splice(A,0,this.splice(e,1)[0]),this},document.addEventListener("DOMContentLoaded",init),chrome.storage.onChanged.addListener(onSettingsChanged),chrome.tabs.onCreated.addListener(onCreatedTab),chrome.tabs.onUpdated.addListener(onUpdatedTab),chrome.windows.onRemoved.addListener(onWindowRemoved);