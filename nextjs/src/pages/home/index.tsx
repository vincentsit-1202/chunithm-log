import axios from 'axios'
import type { NextPage, NextPageContext } from 'next'
import { Session } from 'next-auth'
import { getSession, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { Rating, Song } from 'types'
import { getRatingList } from 'utils/api'
import _, { isString } from 'lodash'
import Users from 'db/model/users'
import Records from 'db/model/records'
import Songs from 'db/model/songs'
import { MdOutlineContentCopy } from 'react-icons/md'
import { calculateSingleSongRating, generateScript, toFixedTrunc } from 'utils/calculateRating'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LayoutWrapper from 'components/LayoutWrapper'
import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { hash } from 'bcryptjs'
import Link from 'next/link'
import { decrypt } from 'utils/encrypt'
import Tooltip from 'rc-tooltip'
import 'rc-tooltip/assets/bootstrap_white.css';
import { log } from 'console'
import { Op } from 'sequelize'

type Props = {
  ratingList: Rating[];
  userId: string
};


const Home: NextPage<Props> = ({ ratingList, userId }) => {
  const [copied, setCopied] = useState(false)
  const timer = useRef<NodeJS.Timeout>()
  const [searchText, setSearchText] = useState('')
  const router = useRouter()
  const ref = useRef(null)
  // const sortedRatingList = useMemo(() => {
  //   if (searchText)
  //     return _.filter(_.orderBy(ratingList, ['rating'], ['desc']), k => k.song.toUpperCase().includes(searchText.toUpperCase()))
  //   else return (_.orderBy(ratingList, ['rating'], ['desc']))
  // }, [searchText, ratingList])
  const sortedRatingList = useMemo(() => {
    if (searchText)
      return _.filter(_.orderBy(ratingList, ['master.rate'], ['desc']), k => {
        if (parseFloat(searchText) > 0.0) {
          let searchRate = parseFloat(searchText)
          return k.song.toUpperCase().includes(searchText.toUpperCase()) || (k.internalRate === searchRate)
        }
        else return k.song.toUpperCase().includes(searchText.toUpperCase())
      })
    else return (_.orderBy(ratingList, ['rating'], ['desc']))
  }, [searchText, ratingList])

  const [average, max] = useMemo(() => {
    const top30 = _.take(_.orderBy(ratingList, ['rating'], ['desc']), 30)
    const top30Total = top30.reduce((a: number, b: Rating) => a + b.rating, 0)
    if (top30.length < 1) return [0, 0]
    return [top30Total / 30, (top30Total + top30[0].rating * 10) / 40]
  }, [ratingList])

  const renderRatingColor = (d: string) => {
    switch (d) {
      case 'master':
        return 'bg-master'

      default:
        break;
    }
  }
  const _renderTableRow = () => {

    return _.map(sortedRatingList, (k, i) => {
      return <tr key={i} className={classNames("even:bg-gray-300/[.6]", 'hover:bg-gray-500/[.4]', 'hover:bg-gray-500/[.4]', { 'border-b': i === 29 && !searchText, 'border-b-red-700': i === 29 && !searchText })} >
        <td>{k.order ?? '-'}</td>
        <td className='song'>{k.song}</td>
        <td>{k.internalRate}</td>
        <td>{k.score}</td>
        <td onClick={() => {
          router.push(k.song)
        }} className='txt-white cursor-pointer'><span className={classNames(`bg-${k.difficulty}`, 'rounded')}>{k.truncatedRating}</span></td>
      </tr >
    })
  }

  return (
    <LayoutWrapper>

      <div className='inner inner-720 tc' >
        <div className='flex box box-shadow mb20' >
          <div id='script' >
            <p> {generateScript(userId)}</p>
          </div>
          <CopyToClipboard text={generateScript(userId)}>
            <Tooltip onVisibleChange={(visible) => {
              if (visible) {
                timer.current = setTimeout(() => {
                  setCopied(false)
                }, 3000)
              }
            }} visible={copied} overlayClassName={'fadeIn'} showArrow={false} overlayStyle={{ width: '6rem', textAlign: "center", }} placement='top' trigger={['click']} overlay={<span>Copied</span>}>
              <button onClick={() => {
                if (copied && timer.current) {
                  clearTimeout(timer.current)
                  timer.current = setTimeout(() => {
                    setCopied(false)
                  }, 3000)
                }
                else setCopied(true)
              }}
                className='btn btn-secondary icon grid-center'>
                <MdOutlineContentCopy></MdOutlineContentCopy></button>
            </Tooltip>

          </CopyToClipboard>


        </div>

        <div className='mb20  items-center'>
          <div className="space-x-5">
            <span >
              {`Top 30 Average : ${toFixedTrunc(average, 2)}`}
            </span>
            <span>
              {`Max : ${toFixedTrunc(max, 2)}`}
            </span>
          </div>
          {/* <button className="btn btn-secondary" onClick={() => { router.push('/song') }}>SONG LIST</button> */}
        </div>
        <div className='inner inner-720'  >
          <input value={searchText} onChange={(e) => {
            setSearchText(e.target.value)
          }} className='p-6 box box-shadow mb20 w-full h-10' placeholder='Song Title / Rate'></input>
        </div>
        <div id='rating-table' className='box box-shadow mb20'>
          {ratingList.length > 0 ?
            <table >
              <tbody>
                {_renderTableRow()}
              </tbody>
            </table>
            : <div className='inner-p20 w-full h-full text-left'>
              <p className='mb10'>
                {`
                  1. Save the above script into a browser bookmark
                `}
              </p>
              <p className='mb10'>
                {`2. Open this page (required login) `}<Link href={"https://chunithm-net-eng.com/mobile/home/"}>https://chunithm-net-eng.com/mobile/home/</Link>
              </p>
              <p className='mb10'>
                {`
                  3. click the bookmark and wait for redirecting to this page`
                }
              </p>
            </div>}
        </div>
        {/* <button className="btn btn-secondary" onClick={() => { signOut() }}>Logout</button> */}
      </div>
    </LayoutWrapper >
  )
}

export default Home

export async function getServerSideProps(context: NextPageContext) {
  // context.res?.setHeader(
  //   'Cache-Control',
  //   'public, s-maxage=1, stale-while-revalidate=59'
  // )
  try {
    let session = await getSession(context)
    if (!session) return {
      redirect: {
        permanent: false,
        destination: '/login',
      }
    }
    const encryptUserId = session.user.id.toString()

    const userID = decrypt(encryptUserId)

    let data = (await Users.findOne({
      where: { id: parseInt(userID) }, include: {
        model: Records,

        include: [{
          model: Songs,
        }]
      }
    }))

    const ratingList = _.map(data?.records, function (o) {
      let song: Song = o.song[o.difficulty]
      let rating = calculateSingleSongRating(song?.rate, o.score)
      let result: Rating = { song: o.song.display_name, combo: song?.combo || 0, internalRate: song?.rate || 0, rating: rating, truncatedRating: toFixedTrunc(rating, 2), score: o.score, difficulty: o.difficulty, }
      return result
    });
    // let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
      props: {
        ratingList: _.map(_.orderBy(ratingList, ['rating'], ['desc']), (k, i) => { return { ...k, order: i + 1 } }),
        // average
        userId: encryptUserId
      },
    }
  }
  catch (e) {
    console.log(e)
    return {
      props: {
        ratingList: [] as Rating[],
      },
    }
  }
}
