<template>
    <div class="my-tab-wrapper hover">
        <transition name="pageFade">
            <div v-if="artwork" class="art-work">
                <img class="art" :src="artwork.background" alt="">
                <div class="info-container">
                    <div class="name emboss" :class="{'pointer':artwork.link}" @click="clickLink('link')">{{artwork.title}}</div>
                    <div class="info emboss">
                        <div class="creator" :class="{'pointer':artwork.artist_link}" @click="clickLink('artist_link')">{{artwork.creator}}</div>
                        <div v-if="artwork.creator&&artwork.attribution" class="divide">|</div>
                        <div class="attribution" :class="{'pointer':artwork.attribution_link}" @click="clickLink('attribution_link')">{{artwork.attribution}}</div>
                    </div>
                    <div class="fav-btn btn" :class="{'show':showFavorite}" @click="showFavorite=!showFavorite">
                        <div class="bg"></div>
                        <div class="face">
                            <div class="icon iconfont icon-fav engrave">
                            </div>
                        </div>
                    </div>
                    <div class="reload-btn btn" :class="{'loading':showLoading}" @click="loadArtWork">
                        <div class="bg"></div>
                        <div class="face back">
                            <div class="icon  iconfont icon-loading engrave" :class="{'loop':showLoading}">
                            </div>
                        </div>
                        <div class="face front">
                            <div class="icon  iconfont icon-reload engrave">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
        <div v-if="router && router.length>0" class="fav-container" :class="{'show':showFavorite}">
            <!--  <transition name="pageFade">
                <div v-if="artwork" class="bg"></div> // :style="{backgroundImage:'url('+artwork.background+')'}"
            </transition>-->
            <div class="title-container" :class="favAnimation">
                <div v-for="(title,n) in router" class="title engrave" :key="'title'+n">
                    <p class="text" :class="{'current':n==router.length-1}" @click="clickFavTitle(n)">{{title.title}}</p>
                    <p v-if="n<router.length-1" class="separator">></p>
                </div>
            </div>
            <div class="fav-list">
                <div v-for="(item) in getPaginatedItems()" class="fav" :class="favAnimation" :key="'fav'+item.id" @click="clickFav(item.id)">
                    <div class="icon">
                        <img v-if="item.url" class="ic" :src="getBestIcon(item.url)" />
                        <div v-else class="iconfont icon-folder engrave"></div>
                    </div>
                    <div class="name engrave">{{item.title}}</div>
                </div>
                <div v-if="router.length<2" class="fav" :class="favAnimation" @click="switchFavType">
                    <div class="icon">
                        <div v-if="router[0].type=='main'" class="iconfont icon-folder engrave"></div>
                        <div v-else class="iconfont icon-fav engrave"></div>
                    </div>
                    <div class="name engrave">{{router[0].type=='main'?favList.others.title:favList.main.title}}</div>
                </div>
                <div v-else class="fav" :class="favAnimation" @click="clickBack">
                    <div class="icon">
                        <div class="iconfont icon-double-arrow-up engrave"></div>
                    </div>
                    <div class="name engrave">返回上层</div>
                </div>
            </div>
            <div v-if="router[router.length-1].childrenTotal>pageSize" class="fav-pagination">
                <div v-for="n in Math.ceil(router[router.length-1].childrenTotal/pageSize)" class="pagination" :class="{'activ':router[router.length-1].page==n}" :key="n" @click="clickPagination(n)"></div>
            </div>
        </div>
    </div>
</template>
<script>
import { random, drop, find, cloneDeep, forEach } from 'lodash-es';
import { findFirst } from 'obj-traverse/lib/obj-traverse';
const pageSize = 14,
    duation = 500;
let database, localCache, animating;
export default {
    name: 'App',
    components: {},
    data: function() {
        return {
            artwork: null,
            showFavorite: true,
            showLoading: false,
            favList: null,
            pageSize: pageSize,
            router: null,
            routerStand: [],
            favAnimation: '',
            paginationAnimation:''
        }
    },

    watch: {
        "routerStand": {
            handler: function(value) {
                if (!animating) {
                    let d = 0;
                    animating = true;
                    if (this.router && this.router.length > 0 && (this.router[this.router.length - 1].folderID != value[value.length - 1].folderID || this.router[this.router.length - 1].page != value[value.length - 1].page)) {
                        this.favAnimation = 'out animating';
                        d = duation * 0.55;
                    }
                    setTimeout(() => {
                        let tmp = [];
                        forEach(value, (v, k) => {
                            let t = this.router ? this.router[k] : null;
                            if (!t || t.folderID != v.folderID || t.page != v.page) {
                                tmp.push(v);
                            } else {
                                tmp.push(t);
                            }
                        });

                        this.router = cloneDeep(tmp);
                        this.favAnimation = '';
                        setTimeout(() => {
                            this.favAnimation = 'in animating';
                            setTimeout(() => {
                                this.favAnimation = 'in';
                                animating = false;
                                console.log('in')
                            }, duation * 1.55)
                        }, 0)
                    }, d)
                }
            }
        }
    },
    mounted() {
        chrome.bookmarks.getTree((res) => {
            console.log(res);
            let o = {};
            o.main = res[0].children[0];
            o.others = res[0].children[1];
            this.favList = o;
            this.relaunch('main');
            console.log(this.favList)
        })
        localCache = localStorage.getItem('localCache');
        if (!localCache) {
            localCache = [];
        } else {
            localCache = JSON.parse(localCache);
        }

        this.$axios.get("https://www.gstatic.com/culturalinstitute/tabext/imax_2_1.json", { 'headers': { 'Accept': 'application/json' }, 'timeout': 3000 }).then(res => {
            if (res.data && res.data.length > 0) {
                database = res.data;
                this.loadArtWork();
            }
        }).catch(() => {
            this.loadFromCache()
        });

    },
    methods: {
        getBestIcon: function(url) {
            if (url) {
                console.log(url)
                let t = url.match(/^http(s)?:\/\/(.*?)\//);
                if(t && t[0]){
                    url = t[0];
                    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=256`;
                }else{
                    return false;
                }
            } else {
                return false;
            }
        },
        getPaginatedItems: function() {
            let t = this.router[this.router.length - 1];
            let offset = (t.page - 1) * pageSize;
            let activeList = this.getFavActiveList();
            let pagedItems = drop(activeList.children, offset).slice(0, pageSize);
            return pagedItems;
        },
        getFavActiveList: function() {
            let t = this.router[this.router.length - 1];
            let activeList = this.favList[t.type];
            activeList = findFirst(activeList, 'children', { id: t.folderID });

            if (t.childrenTotal != activeList.children.length) {
                t.childrenTotal = activeList.children.length;
                t.title = activeList.title;
                t.parentId = activeList.parentId;
                this.router[this.router.length - 1] = t;
            }
            return activeList;
        },
        loadArtWork: function() {
            this.showLoading = true;
            if (database) {
                let l = database.length;
                let idx = random(l - 1);
                let cache = database[idx];
                cache.image += '=s1200-rw';
                this.$axios.get(cache.image, { responseType: "blob", timeout: 3000 }).then(img => {
                    let reader = new window.FileReader();
                    reader.readAsDataURL(img.data);
                    reader.onload = () => {
                        cache.background = reader.result;
                        if (localCache.length < 10) {
                            console.log(localCache.length)
                            localCache.push(cache);
                        } else {
                            let idx = random(localCache.length - 1);
                            console.log(idx);
                            localCache[idx] = cache;
                        }
                        localStorage.setItem('localCache', JSON.stringify(localCache));
                        if (this.artwork) {
                            this.artwork = null;
                            setTimeout(() => {
                                this.artwork = cache;
                            }, 500)
                        } else {
                            this.artwork = cache;
                        }
                        this.showLoading = false;
                    }
                }).catch(() => {
                    this.loadFromCache()
                });
            } else {
                this.loadFromCache()
            }
        },
        loadFromCache: function() {
            if (localCache && localCache.length > 0) {
                let t = localCache[random(localCache.length - 1)];
                if (this.artwork) {
                    if (localCache.length > 1 && this.artwork && t.title == this.artwork.title) {
                        this.loadFromCache();
                    } else {
                        this.artwork = null;
                        setTimeout(() => {
                            this.artwork = t;
                        }, 500)
                    }
                } else {
                    this.artwork = t;
                }

            } else {
                console.log('no cache')
            }
            this.showLoading = false;
        },
        clickLink: function(l) {
            let url = this.artwork[l];
            if (url) {
                if (url.indexOf('http') == -1) {
                    url = 'https://artsandculture.google.com/' + url;
                }
                window.open(url);
            }
        },
        clickNew: function() {

        },
        clickFav: function(id) {
            let activeList = this.getFavActiveList();
            let item = find(activeList.children, (v) => { return v.id == id });

            if (item.url) {
                window.location.href = item.url;
            } else if (item.children.length > 0) {
                this.to(item.id);
            }
        },
        setFavTitle: function() {
            // if (this.favType == 'main') {
            //     if (this.favTitle.length != 1) {
            //         this.favTitle = [{ name: '个人收藏', to: 'main' }]
            //     }
            // } else {
            //     if (this.favTitle.length != 2) {
            //         this.favTitle = [{ name: '个人收藏', to: 'main' }, { name: this.favList.others.title, to: 'others' }]
            //     }
            // }
        },
        clickFavTitle: function(idx) {
            let t = cloneDeep(this.routerStand);
            this.routerStand = t.slice(0, idx + 1);
        },
        switchFavType: function() {
            this.relaunch(this.routerStand[0].type == 'main' ? 'others' : 'main');
        },
        clickPagination: function(id) {
            console.log(id)
            let t = this.routerStand[this.routerStand.length - 1];
            if (t.page != id) {
                t.page = id;
                let newRouterStand = [...this.routerStand];
                newRouterStand[newRouterStand.length - 1] = t;
                this.routerStand = newRouterStand;
            }
        },
        clickBack: function() {
            this.routerStand = this.routerStand.slice(0, -1);
        },
        relaunch: function(type) {
            let o = { type: type, page: 1 };
            o.folderID = this.favList[type].id;
            // o.title = this.favList[type].title;
            this.routerStand = [o];
        },
        to: function(id) {
            let t = this.routerStand[this.routerStand.length - 1];
            let o = { type: t.type, page: 1, folderID: id };
            this.routerStand = [...this.routerStand, o];
        }
    }
}
</script>
<style lang="scss">
@import '@/css/variables.scss';
@import '@/css/app.scss';
@import url("https://use.typekit.net/rej2uzt.css");


.my-tab-wrapper {
    font-family: proxima-nova, sans-serif;

    &.hover,
    &:hover {
        .art-work {
            .info-container {
                opacity: 1;
                pointer-events: auto;
                transform: translate(0, 0);
            }
        }

        .fav-container.show {
            opacity: 1;
            pointer-events: auto;
        }
    }


    .emboss {
        background: $white;
        background-clip: text;
        color: transparent;
        text-shadow: rgba(0, 0, 0, 0.25) 1px 2px 1px;

    }

    .engrave {
        background: $grey-3;
        background-clip: text;
        color: transparent;
        text-shadow: rgba($white, 0.5) 1px 2px 1px;
    }




    .btn {
        position: absolute;
        width: $tool-button-size;
        height: $tool-button-size;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            .bg {
                background-blend-mode: overlay;
            }

            .icon {
                background: $primary;
                background-clip: text;
                color: transparent;
                text-shadow: rgba($white, 0.5) 1px 2px 1px;
            }
        }

        &:active {
            .bg {
                box-shadow: inset 0.2rem 0.2rem 0.5rem $color-dark-shadow,
                    inset -0.2rem -0.2rem 0.5rem $color-light-shadow;
            }
        }

        .bg {
            position: absolute;
            width: 100%;
            height: 100%;
            left: 0;
            top: 0;
            z-index: 1;
            border-radius: calc($tool-button-size*0.2);
            transition: all 260ms ease;
            box-shadow: 0.3rem 0.3rem 0.5rem $color-dark-shadow, -0.2rem -0.2rem 0.4rem $color-light-shadow;
            background-color: $color-theme;
            background-image: linear-gradient(to bottom right, black, white);
            background-blend-mode: soft-light;
        }

        .face {
            position: absolute;
            transform-style: preserve-3d;
            transition: ease-in-out 600ms 500ms;
            backface-visibility: hidden;
            width: 60%;
            height: 60%;
            z-index: 3;
            color: $grey-5;

            .icon {
                width: 100%;
                height: 100%;
                font-size: calc($tool-button-size*0.6);
                transition: all 260ms ease;
            }
        }



        &.fav-btn {
            left: 20px;
            bottom: 20px;

            &.show {
                .icon {
                    background: #E5BB3F;
                    background-clip: text;
                    color: transparent;
                    text-shadow: rgba($white, 0.5) 1px 2px 1px;
                }
            }
        }

        &.reload-btn {
            left: 20px;
            bottom: 60px;
            perspective: 200px;

            .loop {
                animation: loop 1.5s linear infinite;
            }

            .front {
                transform: rotateY(0deg);
                left: 23%;
            }

            .back {
                transform: rotateY(-180deg);
            }

            &.loading {
                .front {
                    transform: rotateY(180deg);
                }

                .back {
                    transform: rotateY(0deg);
                }
            }
        }
    }

    .art-work {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;


        .art {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            object-fit: cover;
        }


        .info-container {
            position: absolute;
            padding: 20px 40px 20px 70px;
            background-color: $color-theme;
            bottom: 0;
            pointer-events: none;
            opacity: 0;
            transition: all .5s ease-in-out;
            transform: translate(0, 100%);
            border-top-right-radius: 8px;
            box-shadow: 3rem 3rem 5rem rgba(51, 51, 51, 0.8);


            .pointer {
                cursor: pointer;

                transition: all 260ms ease;

                &:hover {
                    text-shadow: $primary 1px 2px 1px;
                }
            }

            .name {
                font-weight: 900;
                font-size: 3.6rem;
                margin-bottom: 5px;
                line-height: 1.2;
            }

            .info {
                display: flex;
                align-items: center;
                font-weight: 300;
                font-size: 2.4rem;
                line-height: 1.2;

                .divide {
                    font-size: 2rem;
                    margin: 0 10px;
                }
            }
        }

        @include media-under('small') {
            .art {
                position: relative;
                height: auto;
                object-fit: contain;
            }

            .info-container {
                position: relative;
                padding: 2vw 4vw;

                .info {
                    flex-direction: column;
                    align-items: flex-start;

                    .name {
                        margin-bottom: 1vw;
                    }

                    .attribution {
                        padding-left: 0;
                        margin-left: 0;

                        &:before {
                            content: none;
                        }
                    }
                }
            }
        }
    }

    .fav-container {
        // width: 50vw;
        max-height: 70vh;
        padding: 40px 50px 60px;
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: $color-theme;
        border-radius: 8px;
        box-shadow: 3rem 3rem 5rem rgba(51, 51, 51, 0.8);
        opacity: 0;
        pointer-events: none;
        transition: all 260ms ease-in-out;


        .bg {
            position: absolute;
            left: 0;
            top: 0;
            z-index: 1;
            height: 100%;
            width: 100%;
            background-size: cover;
            background-position: center;
            filter: blur(10px);
            display: flex;
            justify-content: center;
            align-items: center;
            display: none
        }

        .title-container {
            display: flex;
            opacity: 0;
            transition: all mathDiv($duation, 2) ease-out;

            &.out {

                opacity: 0;
            }


            &.in {
                opacity: 1;
            }

            .title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 30px;
                position: relative;
                z-index: 2;
                display: flex;

                .text {
                    cursor: pointer;

                    &.current {
                        pointer-events: none;
                    }

                    &:hover {
                        background: $primary;
                        background-clip: text;
                        color: transparent;
                        text-shadow: rgba($white, 0.5) 1px 2px 1px;
                    }
                }

                .separator {
                    margin: 0 10px;
                }
            }
        }


        .fav-list {
            display: grid;
            grid-gap: 50px 30px;
            grid-template-columns: repeat(5, 100px);
            grid-template-rows: repeat(3, 100px);
            justify-content: space-between;
            position: relative;
            z-index: 2;

            .fav {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 25px;
                transition: all 260ms ease;
                padding: 15px 10px 10px;
                background-color: $color-theme;
                background-image: linear-gradient(to bottom right, black, white);
                background-blend-mode: soft-light;
                cursor: pointer;
                transform-origin: center center;

                box-shadow: none;
                opacity: 0;

                &.out {

                    opacity: 0;
                    box-shadow: none;

                    .icon,
                    .name {
                        opacity: 0;
                    }

                    &.animating {
                        pointer-events: none;
                        transition: all mathDiv($duation, 2) ease-out, box-shadow mathDiv($duation, 2) ease-out;

                        .icon,
                        .name {
                            transition: all mathDiv($duation, 4) ease;
                        }
                    }
                }


                &.in {
                    opacity: 1;
                    box-shadow: 0.3rem 0.3rem 0.5rem $color-dark-shadow,
                        -0.2rem -0.2rem 0.4rem $color-light-shadow;

                    .icon,
                    .name {
                        opacity: 1;
                    }

                    &.animating {
                        pointer-events: none;
                        transition: all $duation ease-out, box-shadow mathDiv($duation, 2) mathDiv($duation, 2) ease-out;

                        .icon,
                        .name {
                            transition: all mathDiv($duation, 2) mathDiv($duation, 2) ease;
                        }
                    }
                }


                &:hover {
                    background-blend-mode: overlay;

                    .name {
                        background: $primary;
                        background-clip: text;
                        color: transparent;
                        text-shadow: rgba($white, 0.5) 1px 2px 1px;
                    }

                    .icon {
                        .iconfont {
                            background: $primary;
                            background-clip: text;
                            color: transparent;
                            text-shadow: rgba($white, 0.5) 1px 2px 1px;

                        }
                    }
                }

                &:active {
                    box-shadow: inset 0.2rem 0.2rem 0.5rem $color-dark-shadow,
                        inset -0.2rem -0.2rem 0.5rem $color-light-shadow;
                }

                .icon {
                    margin-bottom: 10px;
                    width: 40px;
                    height: auto;
                    flex: 1 1 auto;
                    opacity: 0;

                    .ic {
                        border-radius: 5px;
                        width: 40px;
                        height: 40px;
                        transition: all 260ms ease;
                    }

                    .iconfont {
                        transition: all 260ms ease;
                        font-size: 40px;
                    }
                }

                .name {
                    opacity: 0;
                    display: block;
                    display: -webkit-box;
                    max-width: 75px;
                    max-height: $fav-font-size*$fav-line-height*$fav-lines-to-show;
                    margin: 0 auto;
                    font-size: $fav-font-size;
                    line-height: $fav-line-height;
                    -webkit-line-clamp: $fav-lines-to-show;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 0 0 auto;
                    text-align: center;
                    padding-bottom: mathDiv($fav-font-size * $fav-line-height * $fav-lines-to-show, 4);
                    transition: all 260ms ease;
                }
            }


        }

        .fav-pagination {
            display: flex;
            position: absolute;
            bottom: 20px;
            left: 0;
            width: 100%;
            justify-content: center;

            .pagination {
                width: 12px;
                height: 12px;
                margin: 0 8px;
                border-radius: 50%;
                position: relative;
                box-shadow: inset $grey-3 1px 2px 3px;
                cursor: pointer;
                overflow: hidden;

                &.activ {
                    &:before {
                        position: absolute;
                        display: block;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        content: '';
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background-color: $primary;
                    }
                }
            }
        }
    }
}

.pageFade-leave-active {
    transition: opacity .5s ease-in-out
}

.pageFade-enter-active {
    transition: opacity 1s ease-in-out
}

.pageFade-enter,
.pageFade-leave-to {
    opacity: 0;
}

@keyframes loop {
    0% {
        transform: rotate(360deg);
    }

    50% {
        transform: rotate(180deg);
    }

    100% {
        transform: rotate(0deg);
    }
}
</style>
