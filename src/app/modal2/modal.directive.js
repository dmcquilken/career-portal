class CareerPortalModal2Controller {
    /* jshint -W072 */
    constructor(SharedData, $location, SearchService, ApplyService, configuration, locale, $filter, detectUtils) {
        'ngInject';

        this.SharedData = SharedData;
        this.$location = $location;
        this.SearchService = SearchService;
        this.ApplyService = ApplyService;
        this.configuration = configuration;
        this.locale = locale;
        this.$filter = $filter;
        this.isMobile = detectUtils.isMobile();

        // Initialize the model
        this.ApplyService.initializeModel();
        this.closeModal();
    }

    /* jshint +W072 */

    closeModal(applyForm) {
        this.SharedData.modalState = 'closed';
        this.showForm = true;

        // Clear the errors if we have the form
        if (applyForm) {
            applyForm.$setPristine();
        }
    }

    getTooltipText() {
        var tooltip = '<ul>';

        this.configuration.acceptedResumeTypes.forEach(function (type) {
            tooltip += '<li>' + type + '</li>';
        });
        tooltip += '</ul>';
        return tooltip;
    }

}

class CareerPortalModal2 {
    constructor() {
        'ngInject';

        let directive = {
            restrict: 'E',
            templateUrl: 'app/modal2/modal.html',
            scope: false,
            controller: CareerPortalModal2Controller,
            controllerAs: 'modal2',
            bindToController: true,
            replace: true
        };

        return directive;
    }
}

export default CareerPortalModal2;
