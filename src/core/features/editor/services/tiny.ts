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

import { Injectable } from '@angular/core';
import { CoreSite } from '@classes/sites/site';
import { ContextLevel } from '@/core/constants';
import { EmptyObject } from '@/core/utils/types';
import { CoreSites } from '@services/sites';
import { CoreWSExternalWarning } from '@services/ws';
import { makeSingleton } from '@singletons';

const ROOT_CACHE_KEY = 'CoreEditorTiny:';

/**
 * Service with features regarding Tiny editor.
 */
@Injectable({ providedIn: 'root' })
export class CoreEditorTinyProvider {

    /**
     * Gets the TinyMCE configuration for a context.
     *
     * @param contextLevel Context level: system, user, coursecat, course, module or block.
     * @param instanceId ID of item associated with the context level.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise to be resolved when the badge is retrieved.
     */
    async getContextConfiguration(contextLevel: ContextLevel, instanceId: number, siteId?: string):
            Promise<CoreEditorTinyGetContextConfigurationWSResponse> {
        const site = await CoreSites.getSite(siteId);

        if (!site.wsAvailable('editor_tiny_get_context_configuration')) {
            return {
                plugins: {},
            };
        }

        const params: CoreEditorTinyGetContextConfigurationWSParams = {
            contextLevel,
            instanceId,
        };
        const preSets = {
            cacheKey: this.getContextConfigurationCacheKey(contextLevel, instanceId),
            updateFrequency: CoreSite.FREQUENCY_RARELY,
        };

        return await site.read<CoreEditorTinyGetContextConfigurationWSResponse>(
            'editor_tiny_get_context_configuration',
            params,
            preSets,
        );
    }

    /**
     * Get the cache key for the get badges call.
     *
     * @param contextLevel Context level: system, user, coursecat, course, module or block.
     * @param instanceId ID of item associated with the context level.
     * @returns Cache key.
     */
    protected getContextConfigurationCacheKey(contextLevel: ContextLevel, instanceId: number): string {
        return `${ROOT_CACHE_KEY}contextConfiguration:${contextLevel}:${instanceId}`;
    }

    /**
     * Gets the global TinyMCE configuration.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise to be resolved when the badge is retrieved.
     */
    async getGlobalConfiguration(siteId?: string):
            Promise<CoreEditorTinyGetGlobalConfigurationWSResponse> {
        const site = await CoreSites.getSite(siteId);

        if (!site.wsAvailable('editor_tiny_get_global_configuration')) {
            return {
                branding: false,
                availablelanguages: [],
                installedlanguages: [],
                plugins: {},
            };
        }

        const params = {};
        const preSets = {
            cacheKey: this.getGlobalConfigurationCacheKey(),
            updateFrequency: CoreSite.FREQUENCY_RARELY,
        };

        return await site.read<CoreEditorTinyGetGlobalConfigurationWSResponse>(
            'editor_tiny_get_global_configuration',
            params,
            preSets,
        );
    }

    /**
     * Get the cache key for the get badges call.
     *
     * @returns Cache key.
     */
    protected getGlobalConfigurationCacheKey(): string {
        return ROOT_CACHE_KEY + 'globalConfiguration';
    }

    /**
     * Invalidate get context configuration WS call.
     *
     * @param contextLevel Context level: system, user, coursecat, course, module or block.
     * @param instanceId ID of item associated with the context level.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data is invalidated.
     */
    async invalidateContextConfiguration(contextLevel: ContextLevel, instanceId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getContextConfigurationCacheKey(contextLevel, instanceId));
    }

    /**
     * Invalidate get global configuration WS call.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data is invalidated.
     */
    async invalidateGlobalConfiguration(siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getGlobalConfigurationCacheKey());
    }

    /**
     * Returns whether or not configuration services are available for a certain site.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with true if available, resolved with false or rejected otherwise.
     */
    async isAvailable(siteId?: string): Promise<boolean> {
        const site = await CoreSites.getSite(siteId);

        return (
            site.wsAvailable('editor_tiny_get_context_configuration') &&
            site.wsAvailable('editor_tiny_get_global_configuration')
        );
    }

}

/**
 * Params of editor_tiny_get_context_configuration WS.
 */
type CoreEditorTinyGetContextConfigurationWSParams = {
    contextLevel: ContextLevel; // Context level: system, user, coursecat, course, module or block.
    instanceId: number; // ID of item associated with the context level.
};

/**
 * Data returned by editor_tiny_get_context_configuration WS.
 */
type  CoreEditorTinyGetContextConfigurationWSResponse = {
    plugins: {
        accessibilitychecker?: EmptyObject;
        equation?: {
            texfilterenabled: boolean;
        };
        h5p?: {
            canembed: boolean;
            canupload: boolean;
        };
        html?: EmptyObject;
        link?: EmptyObject;
        media?: EmptyObject;
        noautolink?: EmptyObject;
        premium?: {
            canacesspremium: boolean;
        };
        recordrtc?: {
            canrecordaudio: boolean;
            canrecordvideo: boolean;
            canrecordscreen: boolean;
        };
    };
    warnings?: CoreWSExternalWarning[];
};

/**
 * Data returned by editor_tiny_get_global_configuration WS.
 */
type  CoreEditorTinyGetGlobalConfigurationWSResponse = {
    branding: boolean;
    installedlanguages: {lang: string; name: string}[];
    availablelanguages: {lang: string; name: string}[];
    plugins: {
        accessibilitychecker?: EmptyObject;
        equation?: {
            librarygroup1: string[];
            librarygroup2: string[];
            librarygroup3: string[];
            librarygroup4: string[];
            texdocsurl: string;
        };
        h5p?: EmptyObject;
        html?: EmptyObject;
        link?: EmptyObject;
        media?: EmptyObject;
        noautolink?: EmptyObject;
        premium?: {
            apikey: string;
            premiumplugins: string[];
        };
        recordrtc?: {
            allowedtypes: ('audio' | 'video' | 'screen')[];
            allowedpausing: boolean;
            audiobitrate: number;
            videobitrate: number;
            screenbitrate: number;
            audiotimelimit: number;
            videotimelimit: number;
            screentimelimit: number;
            screenwidth: number;
            screenheight: number;
            maxrecsize: number;
        };
    };
    warnings?: CoreWSExternalWarning[];
};

export const CoreEditorTiny = makeSingleton(CoreEditorTinyProvider);
