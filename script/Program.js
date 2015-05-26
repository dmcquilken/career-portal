import 'angular';
import 'angular-animate';
import 'angular-route';
import 'angular-sanitize';
import 'jquery';

import './directives/Checklist';

import CustomNgEnter from './directives/CustomNgEnter';
import ElHeight from './directives/ElHeight';
import Scroll from './directives/Scroll';
import StripHtml from './filters/StripHtml';
import ApplyJob from './services/ApplyJob';
import SearchData from './services/SearchData';
import ShareSocial from './services/ShareSocial';

export default class {

    constructor() {
        throw new Error("Cannot invoke the constructor function of a static class.");
    }

    //#region Properties

    /**
     * A dictionary that contains the collective state of the Program.
     * 
     * @private
     * @static
     * @returns { Object }
     */
    static get _() {
        return this.__ || (this.__ = Object.create(null, {}));
    }

    /**
     * Gets a value indicating whether the Program is running.
     *
     * @static
     * @returns { Boolean }
     */
    static get running() {
        return this._.running || (this._.running = false);
    }
    /**
     * Sets a value indicating whether the Program is running. Attempts to set the value of this property
     * to any value other than true are ignored.
     * 
     * @static
     * @private
     * @param { Boolean } value
     */
    static set _running(value) {
        if (value) this._.running = value;
    }

    //#endregion

    //#region Methods

    /**
     * Bootstraps the CareerPortal angular module on the document in context.
     * 
     * @static
     */
    static run() {
        if (!this.running) {
            this._running = true;

            //??? is this button visible and used? if so, push handler into HeaderCtrl ilo ad-hoc jquery handler
            $('button[name="filters-menu"]').on('click', () => $('html body hgroup aside').toggle());

            angular
                .module('CareerPortal', ['ngRoute', 'ngAnimate', 'ngSanitize', 'Checklist'])
                .config(['$routeProvider', $routeProvider => $routeProvider
                    .when('/jobs', {
                        templateUrl: 'view/joblist.html',
                        controller: 'JobList as jobs'
                    })
                    .when('/jobs/:id', {
                        templateUrl: 'view/overview.html',
                        controller: 'JobDetail as overview'
                    })
                    .otherwise({
                        redirectTo: '/jobs'
                    })
                ])
                .controller('JobList', ['$rootScope', '$location', '$timeout', '$scope', '$http', 'searchData', function($rootScope, $location, $timeout, $scope, $http, searchData) { //jshint ignore:line
                    $rootScope.viewState = 'overview-closed';
                    $scope.searchService = searchData;

                    $scope.loadMoreData = function() {
                        searchData.searchParams.reloadAllData = false;
                        searchData.makeSearchApiCall();
                    };

                    $scope.openSummary = function(id, Data) {
                        searchData.currentDetailData = Data;
                        $location.path('/jobs/' + id);
                    };

                }])
                .controller('JobDetail', ['$rootScope', '$location', '$routeParams', '$route', '$scope', 'searchData', 'shareSocial', function($rootScope, $location, $routeParams, $route, $scope, searchData, shareSocial) { //jshint ignore:line
                    // Form data for the login modal
                    $rootScope.viewState = 'overview-open';

                    $scope.searchService = searchData;

                    this.jobId = $routeParams.id;
                    $scope.jobId = $routeParams.id;

                    var controller = this;

                    this.loadRelatedJobs = function() {
                        $scope.relatedJobs = [];

                        for (var i = 0; i < controller.jobData.categories.data.length; i++) {
                            searchData.loadJobDataByCategory(controller.jobData.categories.data[i].id, function(jobs) {
                                $scope.relatedJobs = $scope.relatedJobs.concat(jobs);
                            }, function() { }, controller.jobData.id); //jshint ignore:line
                        }
                    };

                    this.loadJob = function(jobID) {
                        searchData.loadJobData(jobID, function(job) {
                            controller.jobData = job;

                            controller.loadRelatedJobs();
                        }, function() {
                            controller.goBack();
                        });
                    };

                    if (!searchData.currentDetailData.id) {
                        controller.loadJob(this.jobId);
                    } else {
                        controller.jobData = searchData.currentDetailData;

                        controller.loadRelatedJobs();
                    }

                    this.goBack = function() {
                        $location.path('/jobs');
                    };

                    this.shareFacebook = () => shareSocial.facebook(this);
                    this.shareTwitter = () => shareSocial.twitter(this);
                    this.shareLinkedin = () => shareSocial.linkedin(this);
                    this.shareEmail = () => shareSocial.email(this);

                    this.open = true;

                    this.switchToJob = function(jobID) {
                        $location.path('/jobs/' + jobID);

                        controller.loadJob(jobID);
                    };

                    this.loadJobsWithCategory = function(categoryID) {
                        searchData.helper.emptyCurrentDataList();
                        searchData.helper.resetStartAndTotal();

                        searchData.loadJobDataByCategory(categoryID, function(jobs) {
                            searchData.currentListData = jobs;
                            searchData.searchParams.category.push(categoryID);

                            controller.goBack();
                        }, function() {
                            searchData.makeSearchApiCall();

                            controller.goBack();
                        });
                    };

                    this.applyModal = function() {
                        $rootScope.modalState = 'open';
                    };

                    this.openShare = function() {
                        this.open = this.open === false ? true : false;

                        if (!this.open) {
                            this.share = 'share-open';
                        } else {
                            this.share = '';
                        }
                    };
                }])
                .controller('SideBar', ['$rootScope', '$location', '$scope', 'searchData', function($rootScope, $location, $scope, searchData) {
                    $rootScope.gridState = 'list-view';

                    $scope.searchService = searchData;

                    if (searchData.config.loadJobsOnStart) {
                        searchData.makeSearchApiCall();
                    }

                    $scope.searchJobs = function() {
                        searchData.searchParams.reloadAllData = true;
                        searchData.makeSearchApiCall();
                    };

                    $scope.clearSearchParamsAndLoadData = function() {
                        searchData.helper.clearSearchParams();
                        searchData.makeSearchApiCall();
                    };

                    searchData.getCountBy('address.city', function(locations) {
                        $scope.locations = locations;
                    });

                    $scope.selectedLocations = searchData.searchParams.location;

                    $scope.filterBy = function(field) { //jshint ignore:line
                        //searchData.searchParams[field] = $scope[]
                        //var indexOfValue = searchData.searchParams[field].indexOf(value);
                        //
                        //if(indexOfValue < 0) {
                        //    searchData.searchParams[field].push(value);
                        //} else {
                        //    searchData.searchParams[field].splice(indexOfValue, 1);
                        //}

                        searchData.makeSearchApiCall();
                    };

                    this.switchViewStyle = function(type) {
                        $rootScope.gridState = type + '-view';
                    };

                    this.goBack = function(state) {
                        if ($rootScope.viewState === state) {
                            $location.path('/jobs');
                        }
                    };

                    this.filterCounter = function() {
                        //var counter;
                    };
                }])
                .controller('Header', ['$rootScope', '$location', '$scope', 'searchData', function($rootScope, $location, $scope, searchData) {
                    $scope.searchService = searchData;

                    this.goBack = function() {
                        $location.path('/jobs');
                    };
                }])
                .controller('Modal', ['$rootScope', '$location', '$scope', 'searchData', 'applyJob', function($rootScope, $location, $scope, searchData, applyJob) {
                    $scope.searchService = searchData;
                    $scope.applyService = applyJob;

                    $scope.applyService.initializeModel();

                    this.closeModal = function() {
                        $rootScope.modalState = 'closed';
                        $scope.showForm = true;
                        $scope.searchService.config.portalText.modal.header = $scope.searchService.config.portalText.modal.apply.header;
                        $scope.searchService.config.portalText.modal.subHeader = $scope.searchService.config.portalText.modal.apply.subHeader;
                    };

                    this.applySuccess = function() {
                        $scope.showForm = false;
                        $scope.searchService.config.portalText.modal.header = $scope.searchService.config.portalText.modal.thankYou.header;
                        $scope.searchService.config.portalText.modal.subHeader = $scope.searchService.config.portalText.modal.thankYou.subHeader;
                    };

                    this.closeModal();

                    var controller = this;

                    this.submit = function(applyForm) {
                        applyForm.$submitted = true;

                        if (applyForm.$valid) {
                            $scope.applyService.submit($scope.searchService.currentDetailData.id, function() {
                                controller.applySuccess();
                            });
                        }
                    };
                }])
                .directive('customNgEnter', CustomNgEnter)
                .directive('elHeight', ElHeight)
                .directive('fileModel', ['$parse', function($parse) {
                    return {
                        require: 'ngModel',
                        restrict: 'A',
                        link: function(scope, element, attrs, ngModel) {
                            var model = $parse(attrs.fileModel);
                            var modelSetter = model.assign;

                            ngModel.$render = function() {
                                var fileName = element.val();

                                if (fileName) {
                                    var index = fileName.lastIndexOf('\\');

                                    if (!index) {
                                        index = fileName.lastIndexOf('/');
                                    }

                                    fileName = fileName.substring(index + 1);
                                }

                                ngModel.$setViewValue(fileName);
                            };

                            element.bind('change', function() {
                                scope.$apply(function() {
                                    modelSetter(scope, element[0].files[0]);
                                    ngModel.$render();
                                });
                            });
                        }
                    };
                }])
                .directive("scroll", Scroll)
                .service('searchData', SearchData)
                .service('applyJob', ApplyJob)
                .service('shareSocial', ShareSocial)
                .filter("stripHtml", StripHtml);

            angular.bootstrap(document, ['CareerPortal'], { strictDi: true });
            document.body.style.display = 'block';
        }
    }

//#endregion

}