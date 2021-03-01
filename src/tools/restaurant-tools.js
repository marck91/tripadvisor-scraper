const Apify = require('apify');

const { utils: { log } } = Apify;
const { getReviews, getReviewTags } = require('./general');
/*
function getHours(placeInfo) {
    const placeHolder = [];

    if (!placeInfo.hours) {
        return placeHolder;
    }

    if (!placeInfo.hours.week_ranges) {
        return placeHolder;
    }

    return placeInfo.hours.week_ranges.map(wR => wR.map(day => ({ open: day.open_time, close: day.close_time })));
}*/

function getAncestor(placeInfo, ancestorKey) {
    const placeHolder = '';

    if (!placeInfo.ancestors) {
        return placeHolder;
    }

    if (!placeInfo.ancestors[0]) {
        return placeHolder;
    }

    for (let i = 0; i <= (placeInfo.ancestors.length - 1); i ++) {
        if(placeInfo.ancestors[i]['subcategory'][0]['key'] === ancestorKey){
            return placeInfo.ancestors[i]['name'];
        }
    }

    return placeHolder;
}


async function processRestaurant(placeInfo, client, dataset) {
    const { location_id: id } = placeInfo;
    let reviews = [];
    if (global.INCLUDE_REVIEWS) {
        try {
            reviews = await getReviews(id, client);
        } catch (e) {
            log.error('Could not get reviews', e);
        }
    }
    if (!placeInfo) {
        return;
    }
    const place = {
        id: placeInfo.location_id,
        type: 'RESTAURANT',
        name: placeInfo.name,
        awards: placeInfo.awards && placeInfo.awards.map(award => ({ year: award.year, name: award.display_name })),
        rankingPosition: placeInfo.ranking_position,
        priceLevel: placeInfo.price_level,
        category: placeInfo.ranking_category,
        rating: placeInfo.rating,
        isClosed: placeInfo.is_closed,
        isLongClosed: placeInfo.is_long_closed,
        phone: placeInfo.phone,
        address: placeInfo.address,
        email: placeInfo.email,
        cuisine: placeInfo.cuisine && placeInfo.cuisine.map(cuisine => cuisine.name),
        mealTypes: placeInfo.mealTypes && placeInfo.mealTypes.map(m => m.name),
        //hours: getHours(placeInfo),
        latitude: placeInfo.latitude,
        longitude: placeInfo.longitude,
        webUrl: placeInfo.web_url,
        website: placeInfo.website,
        numberOfReviews: placeInfo.num_reviews,
        rankingDenominator: placeInfo.ranking_denominator,
        rankingString: placeInfo.ranking,

        //subcategory: placeInfo.subcategory && placeInfo.subcategory.map(subcategory => subcategory.key),
        //establishment_types: placeInfo.establishment_types && placeInfo.establishment_types.map(establishment_types => establishment_types.name),
        photoCount: placeInfo.photo_count,
        dishes: placeInfo.dishes && placeInfo.dishes.map(dishes => dishes.name),
        street: placeInfo.address_obj.street1,
        municipality: getAncestor(placeInfo, 'municipality'),
        city: placeInfo.address_obj.city,
        postCode: placeInfo.address_obj.postalcode,
        province: getAncestor(placeInfo, 'province'),
        region: getAncestor(placeInfo, 'region'),
        state: placeInfo.address_obj.state,
        country: placeInfo.address_obj.country,
        reviews,
    };
    if (global.INCLUDE_REVIEW_TAGS) {
        place.reviewTags = await getReviewTags(id);
    }
    log.debug('Data for restaurant: ', place);

    if (dataset) {
        await dataset.pushData(place);
    } else {
        await Apify.setValue('OUTPUT', JSON.stringify(place), { contentType: 'application/json' });
    }
}

module.exports = {
    processRestaurant,
};
