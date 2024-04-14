'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">test documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-82266695e43d8463a63437bbc8d51c8466752c3c6645ddd9554d899d9954b103fa1aa266b4c8bdb7c907f09df34fee3e459a686a8a2d81e5ea89fad2e90fda80"' : 'data-target="#xs-injectables-links-module-AppModule-82266695e43d8463a63437bbc8d51c8466752c3c6645ddd9554d899d9954b103fa1aa266b4c8bdb7c907f09df34fee3e459a686a8a2d81e5ea89fad2e90fda80"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-82266695e43d8463a63437bbc8d51c8466752c3c6645ddd9554d899d9954b103fa1aa266b4c8bdb7c907f09df34fee3e459a686a8a2d81e5ea89fad2e90fda80"' :
                                        'id="xs-injectables-links-module-AppModule-82266695e43d8463a63437bbc8d51c8466752c3c6645ddd9554d899d9954b103fa1aa266b4c8bdb7c907f09df34fee3e459a686a8a2d81e5ea89fad2e90fda80"' }>
                                        <li class="link">
                                            <a href="injectables/CronService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CronService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AssetsModule.html" data-type="entity-link" >AssetsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' : 'data-target="#xs-controllers-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' :
                                            'id="xs-controllers-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' }>
                                            <li class="link">
                                                <a href="controllers/AssetsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssetsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' : 'data-target="#xs-injectables-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' :
                                        'id="xs-injectables-links-module-AssetsModule-9b906967b28cd877c469486b4b84b024715edd9ef3adea7bad820bbbf5d1db06d0c7b6b25a9e2505778f25b25ce481cc87e66636462e45edc4be939baf8dac88"' }>
                                        <li class="link">
                                            <a href="injectables/AssetsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssetsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' : 'data-target="#xs-controllers-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' :
                                            'id="xs-controllers-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' : 'data-target="#xs-injectables-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' :
                                        'id="xs-injectables-links-module-AuthModule-d23adfe3b2572bea2209c1d390b128bd6ef7896000a32f9120aa813c6ed40ce155b00e5901edd19daad4e65c5daab837b5ed692f6a7b35c5a9ea2241f3916519"' }>
                                        <li class="link">
                                            <a href="injectables/AuthMiddleware.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthMiddleware</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthorsModule.html" data-type="entity-link" >AuthorsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' : 'data-target="#xs-controllers-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' :
                                            'id="xs-controllers-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' }>
                                            <li class="link">
                                                <a href="controllers/AuthorsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthorsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' : 'data-target="#xs-injectables-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' :
                                        'id="xs-injectables-links-module-AuthorsModule-e2cb0fe886b9e8aae31e94e6629284298f4824fdfc4a7d32da5fec92b1966413701e5950908b6dae3fcc62f8319189cbca86a1ca4227d50ed741e04e15e789a9"' }>
                                        <li class="link">
                                            <a href="injectables/AuthorsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthorsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/BooksModule.html" data-type="entity-link" >BooksModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' : 'data-target="#xs-controllers-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' :
                                            'id="xs-controllers-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' }>
                                            <li class="link">
                                                <a href="controllers/BooksController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BooksController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' : 'data-target="#xs-injectables-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' :
                                        'id="xs-injectables-links-module-BooksModule-424e7f018debe990e994b30a53abfeb03f8a6e1efd4083d4968dfc6c4281c9d55ad7b4ea778f2b804dfc85d0367a55cf9984114f67a01b372d06caa37b351e4d"' }>
                                        <li class="link">
                                            <a href="injectables/BooksService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BooksService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CampaignsModule.html" data-type="entity-link" >CampaignsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' : 'data-target="#xs-controllers-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' :
                                            'id="xs-controllers-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' }>
                                            <li class="link">
                                                <a href="controllers/CampaignsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CampaignsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' : 'data-target="#xs-injectables-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' :
                                        'id="xs-injectables-links-module-CampaignsModule-c188806eaa39b5a6679ca6545707ab546297db181763e6672eb907795c20e98870654d0ad9d64526a872eba310d5d377e301b5fc1d8058dcbca3586d26e8880d"' }>
                                        <li class="link">
                                            <a href="injectables/CampaignsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CampaignsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CategoryModule.html" data-type="entity-link" >CategoryModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' : 'data-target="#xs-controllers-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' :
                                            'id="xs-controllers-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' }>
                                            <li class="link">
                                                <a href="controllers/CategoryController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoryController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' : 'data-target="#xs-injectables-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' :
                                        'id="xs-injectables-links-module-CategoryModule-23594c6e35fb67ba5d07be9141e320052c9775034376ae2be8dea5abed2c2a896f17ee8d7ef18b2dc0895da4412cc143781c378a43e2caf74150750a9d82b3fd"' }>
                                        <li class="link">
                                            <a href="injectables/AssetsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AssetsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CategoryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CategoryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChaptersModule.html" data-type="entity-link" >ChaptersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' : 'data-target="#xs-controllers-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' :
                                            'id="xs-controllers-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' }>
                                            <li class="link">
                                                <a href="controllers/ChaptersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChaptersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' : 'data-target="#xs-injectables-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' :
                                        'id="xs-injectables-links-module-ChaptersModule-303eaf29daae432362042f27b1dcda15a7dc2c283a750be84cad30cc7a758bbad4b5a38b6ac4c07fadfdc9acc5a2170e4e8af74d8e1ea5f02b252f08ef5aec21"' }>
                                        <li class="link">
                                            <a href="injectables/ChaptersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChaptersService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PromotionalCodesModule.html" data-type="entity-link" >PromotionalCodesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' : 'data-target="#xs-controllers-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' :
                                            'id="xs-controllers-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' }>
                                            <li class="link">
                                                <a href="controllers/PromotionalCodesController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionalCodesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' : 'data-target="#xs-injectables-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' :
                                        'id="xs-injectables-links-module-PromotionalCodesModule-0434f68656329b27d3d3fd8dd5b6b387726956a2abafddb5889f92802fc74aab13427c02f76c27f0dd27e18f9356f0fac973ab4fc2b420371d094b79ce776f6f"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PromotionalCodesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PromotionalCodesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubscriptionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubscriptionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SubscriptionModule.html" data-type="entity-link" >SubscriptionModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' : 'data-target="#xs-controllers-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' :
                                            'id="xs-controllers-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' }>
                                            <li class="link">
                                                <a href="controllers/SubscriptionController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubscriptionController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' : 'data-target="#xs-injectables-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' :
                                        'id="xs-injectables-links-module-SubscriptionModule-794d339671883d2ea7de230ea2cc01c017bb4e72cab76edd72570857eb41b647100d8cbc96324542a6c40f0bbd96c8008ead0b08ea6ebccedc4279d57936ed02"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CronSubscriptionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CronSubscriptionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubscriptionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubscriptionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/WebhooksService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WebhooksService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' : 'data-target="#xs-controllers-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' :
                                            'id="xs-controllers-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/UsersManageController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersManageController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' : 'data-target="#xs-injectables-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' :
                                        'id="xs-injectables-links-module-UsersModule-9bdf516109b14c0c2a4b9770f68e0a76606608164955b5b0493f954dc8f7bb179152c49522527a46add22306a7710cf94eaffcadcdfdde42c54bdb3f62c71bef"' }>
                                        <li class="link">
                                            <a href="injectables/Response.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Response</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubscriptionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubscriptionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersManageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersManageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#controllers-links"' :
                                'data-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/AppController.html" data-type="entity-link" >AppController</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#entities-links"' :
                                'data-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/AssetsEntity.html" data-type="entity-link" >AssetsEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AudioEntity.html" data-type="entity-link" >AudioEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AuthEntity.html" data-type="entity-link" >AuthEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AuthorBookEntity.html" data-type="entity-link" >AuthorBookEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AuthorEntity.html" data-type="entity-link" >AuthorEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AuthorTranslateEntity.html" data-type="entity-link" >AuthorTranslateEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AuthRoleEntity.html" data-type="entity-link" >AuthRoleEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BookEntity.html" data-type="entity-link" >BookEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BooksCampaignEntity.html" data-type="entity-link" >BooksCampaignEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BooksCategoriesEntity.html" data-type="entity-link" >BooksCategoriesEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BookTranslateEntity.html" data-type="entity-link" >BookTranslateEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CampaignBooksEntity.html" data-type="entity-link" >CampaignBooksEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CampaignEntity.html" data-type="entity-link" >CampaignEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CampaignTranslateEntity.html" data-type="entity-link" >CampaignTranslateEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CategoriesEntity.html" data-type="entity-link" >CategoriesEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CategoriesEntity-1.html" data-type="entity-link" >CategoriesEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CategoriesRelationshipEntity.html" data-type="entity-link" >CategoriesRelationshipEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CategoriesTranslateEntity.html" data-type="entity-link" >CategoriesTranslateEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ChaptersEntity.html" data-type="entity-link" >ChaptersEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ChaptersTranslateEntity.html" data-type="entity-link" >ChaptersTranslateEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FeedbackEntity.html" data-type="entity-link" >FeedbackEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/PromotionalCodeEntity.html" data-type="entity-link" >PromotionalCodeEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/RoleEntity.html" data-type="entity-link" >RoleEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/StripePaymentMethodEntity.html" data-type="entity-link" >StripePaymentMethodEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SubscriptionLogsEntity.html" data-type="entity-link" >SubscriptionLogsEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SubscriptionPlanEntity.html" data-type="entity-link" >SubscriptionPlanEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserEntity.html" data-type="entity-link" >UserEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserEntity-1.html" data-type="entity-link" >UserEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserFavBooksEntity.html" data-type="entity-link" >UserFavBooksEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserFreebieBooksEntity.html" data-type="entity-link" >UserFreebieBooksEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserInterestEntity.html" data-type="entity-link" >UserInterestEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserPaymentEntity.html" data-type="entity-link" >UserPaymentEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserSubscriptionEntity.html" data-type="entity-link" >UserSubscriptionEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserTokenEntity.html" data-type="entity-link" >UserTokenEntity</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AddAudioDto.html" data-type="entity-link" >AddAudioDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddBadgeOnSubscriptionPlanTable1625486684418.html" data-type="entity-link" >AddBadgeOnSubscriptionPlanTable1625486684418</a>
                            </li>
                            <li class="link">
                                <a href="classes/addBillingDetailToStripePaymentMethodDetail1612789104036.html" data-type="entity-link" >addBillingDetailToStripePaymentMethodDetail1612789104036</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddBookNote1602066030423.html" data-type="entity-link" >AddBookNote1602066030423</a>
                            </li>
                            <li class="link">
                                <a href="classes/addChapterNumberField1602066030489.html" data-type="entity-link" >addChapterNumberField1602066030489</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddCreatedAtInToken0312086304245.html" data-type="entity-link" >AddCreatedAtInToken0312086304245</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddExtraEndDateOnUserSubscriptionTables1617369643065.html" data-type="entity-link" >AddExtraEndDateOnUserSubscriptionTables1617369643065</a>
                            </li>
                            <li class="link">
                                <a href="classes/addFavDto.html" data-type="entity-link" >addFavDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/addFeedback.html" data-type="entity-link" >addFeedback</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddIsActiveOnCategoriesTable1626096998547.html" data-type="entity-link" >AddIsActiveOnCategoriesTable1626096998547</a>
                            </li>
                            <li class="link">
                                <a href="classes/addISBNField1602153562357.html" data-type="entity-link" >addISBNField1602153562357</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddIsReferralBonusClaimedToUserSubscriptionTable1617974790159.html" data-type="entity-link" >AddIsReferralBonusClaimedToUserSubscriptionTable1617974790159</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddPaymentIdOnUserSubscriptionsTable1610268346880.html" data-type="entity-link" >AddPaymentIdOnUserSubscriptionsTable1610268346880</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddReferralCodeOnUserTable1609398910793.html" data-type="entity-link" >AddReferralCodeOnUserTable1609398910793</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddReferralCodeToUserSubscriptionTable1617808042098.html" data-type="entity-link" >AddReferralCodeToUserSubscriptionTable1617808042098</a>
                            </li>
                            <li class="link">
                                <a href="classes/addRegistrationPlatformOnUserTable1627483156493.html" data-type="entity-link" >addRegistrationPlatformOnUserTable1627483156493</a>
                            </li>
                            <li class="link">
                                <a href="classes/addSequenceOnSubscriptionPlansTable1613806862254.html" data-type="entity-link" >addSequenceOnSubscriptionPlansTable1613806862254</a>
                            </li>
                            <li class="link">
                                <a href="classes/addStatusFieldEnum1602304729707.html" data-type="entity-link" >addStatusFieldEnum1602304729707</a>
                            </li>
                            <li class="link">
                                <a href="classes/addStripeIdOnAuthTable1607838952402.html" data-type="entity-link" >addStripeIdOnAuthTable1607838952402</a>
                            </li>
                            <li class="link">
                                <a href="classes/addStripeIdOnSubscriptionPlanTable1607840486693.html" data-type="entity-link" >addStripeIdOnSubscriptionPlanTable1607840486693</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddTokenTable0311202030423.html" data-type="entity-link" >AddTokenTable0311202030423</a>
                            </li>
                            <li class="link">
                                <a href="classes/AppleBilling.html" data-type="entity-link" >AppleBilling</a>
                            </li>
                            <li class="link">
                                <a href="classes/appleLogin.html" data-type="entity-link" >appleLogin</a>
                            </li>
                            <li class="link">
                                <a href="classes/AwsModule.html" data-type="entity-link" >AwsModule</a>
                            </li>
                            <li class="link">
                                <a href="classes/BackgroundProcessor.html" data-type="entity-link" >BackgroundProcessor</a>
                            </li>
                            <li class="link">
                                <a href="classes/CampaignBodyDto.html" data-type="entity-link" >CampaignBodyDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CampaignStatusDto.html" data-type="entity-link" >CampaignStatusDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CancelSubscriptionDto.html" data-type="entity-link" >CancelSubscriptionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CategoryDto.html" data-type="entity-link" >CategoryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClaimPromotionalCodeDto.html" data-type="entity-link" >ClaimPromotionalCodeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConfigService.html" data-type="entity-link" >ConfigService</a>
                            </li>
                            <li class="link">
                                <a href="classes/createAuthor.html" data-type="entity-link" >createAuthor</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateBookDto.html" data-type="entity-link" >CreateBookDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChapterDto.html" data-type="entity-link" >CreateChapterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCustomerDto.html" data-type="entity-link" >CreateCustomerDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateFeedbacksTable16126857873601.html" data-type="entity-link" >CreateFeedbacksTable16126857873601</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePaymentMethodDto.html" data-type="entity-link" >CreatePaymentMethodDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePromotionalCodeDto.html" data-type="entity-link" >CreatePromotionalCodeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePromotionalCodesTable1625660928756.html" data-type="entity-link" >CreatePromotionalCodesTable1625660928756</a>
                            </li>
                            <li class="link">
                                <a href="classes/createStripeLogsTable1609130276105.html" data-type="entity-link" >createStripeLogsTable1609130276105</a>
                            </li>
                            <li class="link">
                                <a href="classes/createStripePaymentmethodTable1607840836602.html" data-type="entity-link" >createStripePaymentmethodTable1607840836602</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateSubscriptionDto.html" data-type="entity-link" >CreateSubscriptionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/createSubscriptionLogTable1618654894395.html" data-type="entity-link" >createSubscriptionLogTable1618654894395</a>
                            </li>
                            <li class="link">
                                <a href="classes/createUser.html" data-type="entity-link" >createUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeleteAudio.html" data-type="entity-link" >DeleteAudio</a>
                            </li>
                            <li class="link">
                                <a href="classes/dropStripeLogTables1618654163545.html" data-type="entity-link" >dropStripeLogTables1618654163545</a>
                            </li>
                            <li class="link">
                                <a href="classes/EmailSender.html" data-type="entity-link" >EmailSender</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExportFile.html" data-type="entity-link" >ExportFile</a>
                            </li>
                            <li class="link">
                                <a href="classes/FacebookOauth.html" data-type="entity-link" >FacebookOauth</a>
                            </li>
                            <li class="link">
                                <a href="classes/forgetPassword.html" data-type="entity-link" >forgetPassword</a>
                            </li>
                            <li class="link">
                                <a href="classes/generateTokenDto.html" data-type="entity-link" >generateTokenDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GoogleBilling.html" data-type="entity-link" >GoogleBilling</a>
                            </li>
                            <li class="link">
                                <a href="classes/GoogleVerify.html" data-type="entity-link" >GoogleVerify</a>
                            </li>
                            <li class="link">
                                <a href="classes/idDto.html" data-type="entity-link" >idDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/idDto-1.html" data-type="entity-link" >idDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/idDto-2.html" data-type="entity-link" >idDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/IosAuthModule.html" data-type="entity-link" >IosAuthModule</a>
                            </li>
                            <li class="link">
                                <a href="classes/isAdmin.html" data-type="entity-link" >isAdmin</a>
                            </li>
                            <li class="link">
                                <a href="classes/labelDto.html" data-type="entity-link" >labelDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/loginDto.html" data-type="entity-link" >loginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/manageUserCreate.html" data-type="entity-link" >manageUserCreate</a>
                            </li>
                            <li class="link">
                                <a href="classes/migrateChapterLabel0528382111232.html" data-type="entity-link" >migrateChapterLabel0528382111232</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationTable1602264272758.html" data-type="entity-link" >MigrationTable1602264272758</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationTable1602267594496.html" data-type="entity-link" >MigrationTable1602267594496</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationTable1602268040139.html" data-type="entity-link" >MigrationTable1602268040139</a>
                            </li>
                            <li class="link">
                                <a href="classes/modifyAuthor1702066030489.html" data-type="entity-link" >modifyAuthor1702066030489</a>
                            </li>
                            <li class="link">
                                <a href="classes/ModifyTokenTable1211201030123.html" data-type="entity-link" >ModifyTokenTable1211201030123</a>
                            </li>
                            <li class="link">
                                <a href="classes/myDeskQueryDto.html" data-type="entity-link" >myDeskQueryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/myFavBookDto.html" data-type="entity-link" >myFavBookDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/myProgressDTo.html" data-type="entity-link" >myProgressDTo</a>
                            </li>
                            <li class="link">
                                <a href="classes/passworConfirm.html" data-type="entity-link" >passworConfirm</a>
                            </li>
                            <li class="link">
                                <a href="classes/queryDto.html" data-type="entity-link" >queryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/queryDto-1.html" data-type="entity-link" >queryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/queryDto-2.html" data-type="entity-link" >queryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/queryDto-3.html" data-type="entity-link" >queryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/queryDto-4.html" data-type="entity-link" >queryDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/resetPassword.html" data-type="entity-link" >resetPassword</a>
                            </li>
                            <li class="link">
                                <a href="classes/statusDto.html" data-type="entity-link" >statusDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/StripeHelper.html" data-type="entity-link" >StripeHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubscribeDto.html" data-type="entity-link" >SubscribeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SwitchCategoryStatusDto.html" data-type="entity-link" >SwitchCategoryStatusDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TableEntity.html" data-type="entity-link" >TableEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateCancelEndPeriodSubscribeDto.html" data-type="entity-link" >UpdateCancelEndPeriodSubscribeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateChapterDto.html" data-type="entity-link" >updateChapterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/updatePassword.html" data-type="entity-link" >updatePassword</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRoleDto.html" data-type="entity-link" >UpdateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateStatusBook1602305349143.html" data-type="entity-link" >updateStatusBook1602305349143</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateSubscriptionDto.html" data-type="entity-link" >UpdateSubscriptionDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateUser.html" data-type="entity-link" >updateUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/verifyDto.html" data-type="entity-link" >verifyDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/VerifyPurchaseDto.html" data-type="entity-link" >VerifyPurchaseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/verifyTokenMobileDto.html" data-type="entity-link" >verifyTokenMobileDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/IsAdmin.html" data-type="entity-link" >IsAdmin</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/IsEditor.html" data-type="entity-link" >IsEditor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserMiddleware.html" data-type="entity-link" >UserMiddleware</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Author.html" data-type="entity-link" >Author</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthorList.html" data-type="entity-link" >AuthorList</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Book.html" data-type="entity-link" >Book</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BookDetail.html" data-type="entity-link" >BookDetail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Books.html" data-type="entity-link" >Books</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BooksList.html" data-type="entity-link" >BooksList</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Campaign.html" data-type="entity-link" >Campaign</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CampaignBook.html" data-type="entity-link" >CampaignBook</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CampaignDetail.html" data-type="entity-link" >CampaignDetail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CampaignDetailWithActive.html" data-type="entity-link" >CampaignDetailWithActive</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CampaignDetailWithoutBooks.html" data-type="entity-link" >CampaignDetailWithoutBooks</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CampaignsList.html" data-type="entity-link" >CampaignsList</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CampaignWithLabel.html" data-type="entity-link" >CampaignWithLabel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Categories.html" data-type="entity-link" >Categories</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chapter.html" data-type="entity-link" >Chapter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChaptersList.html" data-type="entity-link" >ChaptersList</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination-1.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination-2.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination-3.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaymentMethod.html" data-type="entity-link" >PaymentMethod</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PromotionalCode.html" data-type="entity-link" >PromotionalCode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PromotionalCodeList.html" data-type="entity-link" >PromotionalCodeList</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Setting.html" data-type="entity-link" >Setting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Subscription.html" data-type="entity-link" >Subscription</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubscriptionLogs.html" data-type="entity-link" >SubscriptionLogs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Token.html" data-type="entity-link" >Token</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});