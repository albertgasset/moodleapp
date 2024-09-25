// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    Component,
    Input,
    Output,
    ElementRef,
    EventEmitter,
    Optional, AfterViewInit,
    ViewChild, OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreEventFormActionData, CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreDirectivesRegistry } from '@singletons/directives-registry';
import { CoreLoadingComponent } from '@components/loading/loading';
import { CoreCancellablePromise } from '@classes/cancellable-promise';
import { CoreDom } from '@singletons/dom';
import { ContextLevel } from '@/core/constants';
import { CoreWait } from '@singletons/wait';
import { toBoolean } from '@/core/transforms/boolean';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { RawEditorOptions } from 'tinymce';
import { getEditorOptions } from '@features/editor/utils/tiny-config';
import { CoreEditorOffline } from '@features/editor/services/editor-offline';
import { CoreSites } from '@services/sites';
import { CoreToasts } from '@services/toasts';

/**
 * Component to display a rich text editor if enabled.
 *
 * If enabled, this component will show a rich text editor. Otherwise it'll show a regular textarea.
 *
 * Example:
 * <core-rich-text-editor [control]="control" [placeholder]="field.name"></core-rich-text-editor>
 */
@Component({
    selector: 'core-editor-tiny-editor',
    templateUrl: 'tiny-editor.html',
    styleUrls: ['tiny-editor.scss'],
})
export class CoreEditorTinyEditorComponent implements AfterViewInit, OnDestroy {

    @Input() placeholder = ''; // Placeholder to set in textarea.
    @Input() control?: FormControl<string | undefined | null>; // Form control.
    @Input() name = 'core-editor-tiny-editor'; // Name to set to the textarea.
    @Input() component?: string; // The component to link the files to.
    @Input() componentId?: number; // An ID to use in conjunction with the component.
    @Input({ transform: toBoolean }) autoSave = true; // Whether to auto-save the contents in a draft.
    @Input() contextLevel?: ContextLevel; // The context level of the text.
    @Input() contextInstanceId?: number; // The instance ID related to the context.
    @Input() elementId?: string; // An ID to set to the element.
    @Input() draftExtraParams?: Record<string, unknown>; // Extra params to identify the draft.
    @Output() contentChanged: EventEmitter<string | undefined | null>;

    @ViewChild(EditorComponent) editor?: EditorComponent;

    protected readonly DRAFT_AUTOSAVE_FREQUENCY = 30000;
    protected readonly RESTORE_MESSAGE_CLEAR_TIME = 6000;
    protected readonly SAVE_MESSAGE_CLEAR_TIME = 2000;

    protected element: HTMLElement;
    protected valueChangeSubscription?: Subscription;
    protected keyboardObserver?: CoreEventObserver;
    protected resetObserver?: CoreEventObserver;
    protected labelObserver?: MutationObserver;
    protected initHeightInterval?: number;
    protected isCurrentView = true;
    protected toolbarButtonWidth = 44;
    protected toolbarArrowWidth = 44;
    protected pageInstance: string;
    protected autoSaveInterval?: number;
    protected lastDraft = '';
    protected draftWasRestored = false;
    protected originalContent?: string;
    protected resizeFunction?: () => Promise<number>;
    protected resizeListener?: CoreEventObserver;
    protected domPromise?: CoreCancellablePromise<void>;
    protected buttonsDomPromise?: CoreCancellablePromise<void>;
    protected blurTimeout?: number;

    initOptions?: RawEditorOptions;

    rteEnabled = false;
    isPhone = false;
    toolbarHidden = false;
    toolbarArrows = false;
    toolbarPrevHidden = true;
    toolbarNextHidden = false;
    canScanQR = false;
    ariaLabelledBy?: string;
    isEmpty = true;

    constructor(
        @Optional() protected content: IonContent,
        elementRef: ElementRef,
    ) {
        this.contentChanged = new EventEmitter<string>();
        this.element = elementRef.nativeElement;
        this.pageInstance = 'app_' + Date.now(); // Generate a "unique" ID based on timestamp.
    }

    /**
     * @inheritdoc
     */
    async ngAfterViewInit(): Promise<void> {
        await this.waitLoadingsDone();

        // Setup the editor.
        this.originalContent = this.control?.value ?? undefined;
        this.lastDraft = this.control?.value ?? '';

        this.initOptions = await getEditorOptions(this.contextLevel ?? ContextLevel.SYSTEM, this.contextInstanceId ?? 0);

        this.maximizeEditorSize();

        this.setListeners();

        if (this.elementId) {
            // Prepend elementId with 'id_' like in web. Don't use a setter for this because the value shouldn't change.
            this.elementId = 'id_' + this.elementId;
            this.element.setAttribute('id', this.elementId);
        }

        // Update tags for a11y.
        // this.replaceTags(['b', 'i'], ['strong', 'em']);

        if (this.shouldAutoSaveDrafts()) {
            this.restoreDraft();

            this.autoSaveDrafts();

            this.deleteDraftOnSubmitOrCancel();
        }

        // this.setupIonItem();
    }

    /**
     * Set listeners and observers.
     */
    protected setListeners(): void {
        // Listen for changes on the control to update the editor (if it is updated from outside of this component).
        this.valueChangeSubscription = this.control?.valueChanges.subscribe((newValue) => {
            if (this.draftWasRestored && this.originalContent === newValue) {
                // A draft was restored and the content hasn't changed in the site. Use the draft value instead of this one.
                this.control?.setValue(this.lastDraft, { emitEvent: false });

                return;
            }

            // Apply the new content.
            this.originalContent = newValue ?? undefined;
            this.editor?.editor.setContent(newValue ?? '');

            // Save a draft so the original content is saved.
            this.lastDraft = newValue ?? '';
            CoreEditorOffline.saveDraft(
                this.contextLevel || ContextLevel.SYSTEM,
                this.contextInstanceId || 0,
                this.elementId || '',
                this.draftExtraParams || {},
                this.pageInstance,
                this.lastDraft,
                this.originalContent,
            );
        });

        this.resizeListener = CoreDom.onWindowResize(() => {
            this.windowResized();
        }, 50);

        this.keyboardObserver = CoreEvents.on(CoreEvents.KEYBOARD_CHANGE, () => {
            // Opening or closing the keyboard also calls the resize function, but sometimes the resize is called too soon.
            // Check the height again, now the window height should have been updated.
            this.maximizeEditorSize();
        });
    }

    /**
     * Resize editor to maximize the space occupied.
     */
    protected async maximizeEditorSize(): Promise<void> {
        if (!this.initOptions) {
            return;
        }

        const blankHeight = await this.getBlankHeightInContent();
        const oldHeight = this.element.getBoundingClientRect().height;
        const newHeight = `${blankHeight + oldHeight}px`;

        this.initOptions.height = newHeight;
        const editorElement = this.element.querySelector<HTMLElement>('div.tox-tinymce');
        if (editorElement) {
            editorElement.style.height = newHeight;
        }
    }

    /**
     * Wait until all <core-loading> children inside the page.
     *
     * @returns Promise resolved when loadings are done.
     */
    protected async waitLoadingsDone(): Promise<void> {
        this.domPromise = CoreDom.waitToBeInDOM(this.element);

        await this.domPromise;

        const page = this.element.closest('.ion-page');
        if (!page) {
            return;
        }

        await CoreDirectivesRegistry.waitDirectivesReady(page, 'core-loading', CoreLoadingComponent);
    }

    /**
     * Get the height of the space in blank at the end of the page.
     *
     * @returns Blank height in px. Will be negative if no blank space.
     */
    protected async getBlankHeightInContent(): Promise<number> {
        await CoreWait.nextTicks(5); // Ensure content is completely loaded in the DOM.

        let content: Element | null = this.element.closest('ion-content');
        const contentHeight = await CoreDomUtils.getContentHeight(this.content);

        // Get first children with content, not fixed.
        let scrollContentHeight = 0;
        while (scrollContentHeight === 0 && content?.children) {
            const children = Array.from(content.children)
                .filter((element) => element.slot !== 'fixed' && !element.classList.contains('core-loading-container'));

            scrollContentHeight = children
                .map((element) => element.getBoundingClientRect().height)
                .reduce((a,b) => a + b, 0);

            content = children[0];
        }

        return contentHeight - scrollContentHeight;
    }

    /**
     * On change function to sync with form data.
     */
    onChange(): void {
        if (!this.editor) {
            return;
        }

        const content = this.editor.editor.getContent();
        if (this.isNullOrWhiteSpace(content)) {
            this.clearText();
        } else {
            // The textarea and the form control must receive the original URLs.
            this.restoreExternalContent();
            // Don't emit event so our valueChanges doesn't get notified by this change.
            this.control?.setValue(content, { emitEvent: false });
            this.control?.markAsDirty();
            // Treat URLs again for the editor.
            this.treatExternalContent();
        }

        this.contentChanged.emit(this.control?.value);
    }

    /**
     * Treat elements that can contain external content.
     * We only search for images because the editor should receive unfiltered text, so the multimedia filter won't be applied.
     * Treating videos and audios in here is complex, so if a user manually adds one he won't be able to play it in the editor.
     */
    protected treatExternalContent(): void {
        if (!CoreSites.isLoggedIn() || !this.editor) {
            // Only treat external content if the user is logged in.
            return;
        }

        // const elements = Array.from(this.editorElement.querySelectorAll('img'));
        // const site = CoreSites.getCurrentSite();
        // const siteId = CoreSites.getCurrentSiteId();
        // const canDownloadFiles = !site || site.canDownloadFiles();
        // elements.forEach(async (el) => {
        //     if (el.getAttribute('data-original-src')) {
        //         // Already treated.
        //         return;
        //     }

        //     const url = el.src;

        //     if (!url || !CoreUrl.isDownloadableUrl(url) || (!canDownloadFiles && site?.isSitePluginFileUrl(url))) {
        //         // Nothing to treat.
        //         return;
        //     }

        //     // Check if it's downloaded.
        //     const finalUrl = await CoreFilepool.getSrcByUrl(siteId, url, this.component, this.componentId);

        //     // Check again if it's already treated, this function can be called concurrently more than once.
        //     if (!el.getAttribute('data-original-src')) {
        //         el.setAttribute('data-original-src', el.src);
        //         el.setAttribute('src', finalUrl);
        //     }
        // });
    }

    /**
     * Reverts changes made by treatExternalContent.
     */
    protected restoreExternalContent(): void {
        if (!this.editor) {
            return;
        }

        // const elements = Array.from(this.editorElement.querySelectorAll('img'));
        // elements.forEach((el) => {
        //     const originalUrl = el.getAttribute('data-original-src');
        //     if (originalUrl) {
        //         el.setAttribute('src', originalUrl);
        //         el.removeAttribute('data-original-src');
        //     }
        // });
    }

    /**
     * Check if text is empty.
     *
     * @param valueOrEl Text or element containing the text.
     * @returns If value is null only a white space.
     */
    protected isNullOrWhiteSpace(valueOrEl: string | HTMLElement | null | undefined): boolean {
        if (valueOrEl === null || valueOrEl === undefined) {
            this.isEmpty = true;

            return true;
        }

        this.isEmpty = typeof valueOrEl === 'string' ? CoreDom.htmlIsBlank(valueOrEl) : !CoreDom.elementHasContent(valueOrEl);

        return this.isEmpty;
    }

    /**
     * Set the content of the textarea and the editor element.
     *
     * @param value New content.
     */
    protected setContent(value: string | null | undefined): void {
        if (!this.editor) {
            return;
        }

        if (this.isNullOrWhiteSpace(value)) {
            // Avoid loops.
            if (this.editor.editor.getContent() !== '<p></p>') {
                this.editor.editor.setContent('<p></p>');
            }
        } else {
            value = value || '';
            // Avoid loops.
            if (this.editor.editor.getContent() !== value) {
                this.editor.editor.setContent(value);
            }
            this.treatExternalContent();
        }
    }

    /**
     * Clear the text.
     */
    clearText(): void {
        this.setContent(null);

        // Don't emit event so our valueChanges doesn't get notified by this change.
        this.control?.setValue(null, { emitEvent: false });
    }

    /**
     * Check if should auto save drafts.
     *
     * @returns Whether it should auto save drafts.
     */
    protected shouldAutoSaveDrafts(): boolean {
        return !!CoreSites.getCurrentSite() &&
                this.autoSave &&
                this.contextLevel !== undefined &&
                this.contextInstanceId !== undefined &&
                this.elementId !== undefined;
    }

    /**
     * Restore a draft if there is any.
     *
     * @returns Promise resolved when done.
     */
    protected async restoreDraft(): Promise<void> {
        try {
            const entry = await CoreEditorOffline.resumeDraft(
                this.contextLevel || ContextLevel.SYSTEM,
                this.contextInstanceId || 0,
                this.elementId || '',
                this.draftExtraParams || {},
                this.pageInstance,
                this.originalContent,
            );

            if (entry === undefined) {
                // No draft found.
                return;
            }

            this.element.classList.add('ion-touched');
            this.element.classList.remove('ion-untouched');

            let draftText = entry.drafttext || '';

            // Revert untouched editor contents to an empty string.
            if (draftText === '<p></p>' || draftText === '<p><br></p>' || draftText === '<br>' ||
                    draftText === '<p>&nbsp;</p>' || draftText === '<p><br>&nbsp;</p>') {
                draftText = '';
            }

            if (draftText !== '' && this.control && draftText != this.control.value) {
                // Restore the draft.
                this.control.setValue(draftText, { emitEvent: false });
                if (this.editor) {
                    this.editor.editor.setContent(draftText);
                } else {
                    this.originalContent = draftText;
                }
                this.lastDraft = draftText;
                this.draftWasRestored = true;
                this.originalContent = entry.originalcontent;

                if (entry.drafttext != entry.originalcontent) {
                    // Notify the user.
                    this.showMessage('core.editor.textrecovered', this.RESTORE_MESSAGE_CLEAR_TIME);
                }
            }
        } catch {
            // Ignore errors, shouldn't happen.
        }
    }

    /**
     * Automatically save drafts every certain time.
     */
    protected autoSaveDrafts(): void {
        this.autoSaveInterval = window.setInterval(async () => {
            if (!this.control) {
                return;
            }

            const newText = this.control.value ?? '';

            if (this.lastDraft === newText) {
                // Text hasn't changed, nothing to save.
                return;
            }

            try {
                await CoreEditorOffline.saveDraft(
                    this.contextLevel || ContextLevel.SYSTEM,
                    this.contextInstanceId || 0,
                    this.elementId || '',
                    this.draftExtraParams || {},
                    this.pageInstance,
                    newText,
                    this.originalContent,
                );

                // Draft saved, notify the user.
                this.lastDraft = newText;
                this.showMessage('core.editor.autosavesucceeded', this.SAVE_MESSAGE_CLEAR_TIME);
            } catch {
                // Error saving draft.
            }
        }, this.DRAFT_AUTOSAVE_FREQUENCY);
    }

    /**
     * Delete the draft when the form is submitted or cancelled.
     */
    protected deleteDraftOnSubmitOrCancel(): void {
        this.resetObserver = CoreEvents.on(CoreEvents.FORM_ACTION, async (data: CoreEventFormActionData) => {
            const form = this.element.closest('form');

            if (data.form && form && data.form === form) {
                try {
                    await CoreEditorOffline.deleteDraft(
                        this.contextLevel || ContextLevel.SYSTEM,
                        this.contextInstanceId || 0,
                        this.elementId || '',
                        this.draftExtraParams || {},
                    );
                } catch (error) {
                    // Error deleting draft. Shouldn't happen.
                }
            }
        }, CoreSites.getCurrentSiteId());
    }

    /**
     * Show a message.
     *
     * @param message Identifier of the message to display.
     * @param timeout Number of milliseconds when to remove the message.
     */
    protected showMessage(message: string, timeout: number): void {
        CoreToasts.show({
            message,
            translateMessage: true,
            duration: timeout,
        });
    }

    /**
     * Window resized.
     */
    protected async windowResized(): Promise<void> {
        await CoreWait.waitForResizeDone();

        this.maximizeEditorSize();
    }

    /**
     * User entered the page that contains the component.
     */
    ionViewDidEnter(): void {
        this.isCurrentView = true;
    }

    /**
     * User left the page that contains the component.
     */
    ionViewDidLeave(): void {
        this.isCurrentView = false;
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.valueChangeSubscription?.unsubscribe();

        clearInterval(this.autoSaveInterval);

        this.resetObserver?.off();
        this.keyboardObserver?.off();
        this.resizeListener?.off();

        this.labelObserver?.disconnect();

        this.domPromise?.cancel();
    }

}
