import ModalLight from '@mdf/metaui-web/lib/components/common/ModalLight'
import React from 'react'

export const openLoadingModal = function () {
  return ModalLight({
    className: 'billing-onsettle-ModalLight',
    maskClosable: false,
    closable: false,
    width: '200px',
    content: <div className='billing-onsettle-ModalLight-content'>

      <div>
        <div className='ant-spin ant-spin-lg ant-spin-spinning'><span
          className='ant-spin-dot ant-spin-dot-spin'><i /><i /><i /><i /></span></div>
      </div>
      <div className='billing-onsettle-ModalLight-text'>结算中...</div>
    </div>
  })
}

export const showSuccessModal = function (lastBill) {
  const modal = ModalLight({
    content: <div>
      <div className='pay-center'>
        <div className='pay-success' />
        <p>结算成功</p>
      </div>
      <div className='pay-receivable'>
        <div className='clearfix'><span className='fl'>应收金额</span><span className='fr'>{lastBill.receivable}</span>
        </div>
        <div className='clearfix'><span className='fl'>实收金额</span><span className='fr'>{lastBill.receipts}</span>
        </div>
      </div>
      <div className='pay-star'>*******************************************************************************
      </div>
      <div className='pay-center pay-change'>
        <div>找零</div>
        <div>{lastBill.change}</div>
      </div>
    </div>
  })
  setTimeout(modal.destroy, 3000)
}

export const openAwaitModal = function (tip, manually) {
  const tips = tip || '取会员价中'

  return ModalLight({
    className: 'billing-onsettle-ModalLight',
    maskClosable: false,
    closable: false,
    width: '200px',
    content: <div className='billing-onsettle-ModalLight-content'>

      <div>
        <div className='ant-spin ant-spin-lg ant-spin-spinning'><span
          className='ant-spin-dot ant-spin-dot-spin'><i /><i /><i /><i /></span></div>
      </div>
      <div className='billing-onsettle-ModalLight-text'>{`${tips}...`}</div>
    </div>
  }, manually)
}
