// dashboard analytics page
const index = (request, response, next) => {
    response.render('../views/pages/dashboard/analytics',{
        title:'Dashboard Analytics',
        name:'dashboard_analytics'
    })
}

// dashboard marketing page
const marketing = (request, response, next) => {
    response.render('../views/pages/dashboard/marketing',{
        title:'Dashboard Marketing',
        name:'dashboard_marketing'
    })
}

// dashboard operasional page
const operasional = (request, response, next) => {
    response.render('../views/pages/dashboard/operasional',{
        title:'Dashboard Operasional',
        name:'dashboard_operasional'
    })
}

// dashboard logistics page
const logistics = (request, response, next) => {
    response.render('../views/pages/dashboard/logistics',{
        title:'Dashboard Logistics',
        name:'dashboard_logistics'
    })
}

// dashboard keuangan page
const keuangan = (request, response, next) => {
    response.render('../views/pages/dashboard/keuangan',{
        title:'Dashboard Keuangan',
        name:'dashboard_keuangan'
    })
}

// dashboard hrd page
const hrd = (request, response, next) => {
    response.render('../views/pages/dashboard/hrd',{
        title:'Dashboard HRD',
        name:'dashboard_hrd'
    })
}

// dashboard cabang page
const cabang = (request, response, next) => {
    response.render('../views/pages/dashboard/cabang',{
        title:'Dashboard Cabang',
        name:'dashboard_cabang'
    })
}

module.exports = {
    index,
    marketing,
    operasional,
    logistics,
    keuangan,
    hrd,
    cabang
}